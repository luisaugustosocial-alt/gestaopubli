const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("node:crypto");

initializeApp();
const db = getFirestore();
const SUPABASE_URL = defineSecret("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = defineSecret("SUPABASE_SERVICE_ROLE_KEY");
const BUCKET = "gestaopubli-files";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
function requireUser(request) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Entre na sua conta.");
  return request.auth.uid;
}
function storageClient() {
  return createClient(SUPABASE_URL.value(), SUPABASE_SERVICE_ROLE_KEY.value(), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
async function findApproval(token) {
  if (typeof token !== "string" || token.length < 40 || token.length > 200) {
    throw new HttpsError("not-found", "Link de aprovação inválido.");
  }
  const snap = await db.collection("clientApprovals").where("tokenHash", "==", hashToken(token)).limit(1).get();
  if (snap.empty) throw new HttpsError("not-found", "Este link não existe ou foi revogado.");
  const doc = snap.docs[0];
  const data = doc.data();
  if (data.revokedAt) throw new HttpsError("failed-precondition", "Este link foi revogado.");
  if (data.expiresAt && data.expiresAt.toMillis() < Date.now()) {
    throw new HttpsError("deadline-exceeded", "Este link expirou.");
  }
  return { ref: doc.ref, data };
}

exports.createClientApproval = onCall(
  { secrets: [SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY] },
  async (request) => {
    const uid = requireUser(request);
    const { projectId, fileRecordId, clientName, clientEmail, instructions } = request.data || {};
    if (!projectId || !fileRecordId || !String(clientName || "").trim()) {
      throw new HttpsError("invalid-argument", "Informe projeto, arquivo e nome do cliente.");
    }
    const [projectSnap, fileSnap] = await Promise.all([
      db.collection("projects").doc(projectId).get(),
      db.collection("projects").doc(fileRecordId).get()
    ]);
    if (!projectSnap.exists || !fileSnap.exists ||
        projectSnap.data().ownerUid !== uid || fileSnap.data().ownerUid !== uid ||
        fileSnap.data().recordType !== "file" || fileSnap.data().projectId !== projectId ||
        !fileSnap.data().storagePath) {
      throw new HttpsError("permission-denied", "Projeto ou arquivo não pertence à sua conta.");
    }
    const token = crypto.randomBytes(32).toString("base64url");
    const file = fileSnap.data();
    const record = {
      ownerUid: uid, projectId, fileRecordId,
      projectName: projectSnap.data().name || "",
      fileName: file.name || "Arquivo",
      storagePath: file.storagePath,
      clientName: String(clientName).trim(),
      clientEmail: String(clientEmail || "").trim(),
      instructions: String(instructions || "").trim(),
      tokenHash: hashToken(token),
      status: "Aguardando cliente",
      comments: [],
      history: [{ action: "link_created", at: new Date().toISOString() }],
      revokedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    const saved = await db.collection("clientApprovals").add(record);
    return { id: saved.id, token, status: record.status };
  }
);

exports.getClientApproval = onCall(
  { secrets: [SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY] },
  async (request) => {
    const { ref, data } = await findApproval(request.data?.token);
    const { data: signed, error } = await storageClient().storage
      .from(BUCKET).createSignedUrl(data.storagePath, 900);
    if (error) throw new HttpsError("internal", "Não foi possível abrir o arquivo.");
    return {
      id: ref.id, projectName: data.projectName, fileName: data.fileName,
      clientName: data.clientName, instructions: data.instructions || "",
      status: data.status, comments: data.comments || [],
      fileUrl: signed.signedUrl
    };
  }
);

exports.respondToClientApproval = onCall(async (request) => {
  const { ref, data } = await findApproval(request.data?.token);
  const { action, message } = request.data || {};
  if (!["approved", "rejected", "changes_requested", "comment"].includes(action)) {
    throw new HttpsError("invalid-argument", "Resposta inválida.");
  }
  const text = String(message || "").trim().slice(0, 3000);
  if (action !== "approved" && !text) {
    throw new HttpsError("invalid-argument", "Escreva um comentário para enviar essa resposta.");
  }
  if (["approved", "rejected", "changes_requested"].includes(action) &&
      data.status !== "Aguardando cliente" && data.status !== "Alterações solicitadas") {
    throw new HttpsError("failed-precondition", "Esta aprovação já foi finalizada.");
  }
  const status = action === "approved" ? "Aprovado" :
    action === "rejected" ? "Rejeitado" :
    action === "changes_requested" ? "Alterações solicitadas" : data.status;
  const entry = { action, message: text, at: new Date().toISOString() };
  await ref.update({
    status,
    comments: FieldValue.arrayUnion(entry),
    history: FieldValue.arrayUnion(entry),
    updatedAt: FieldValue.serverTimestamp()
  });
  return { success: true, status };
});

exports.revokeClientApproval = onCall(async (request) => {
  const uid = requireUser(request);
  const id = request.data?.id;
  if (!id) throw new HttpsError("invalid-argument", "Aprovação não informada.");
  const ref = db.collection("clientApprovals").doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data().ownerUid !== uid) {
    throw new HttpsError("not-found", "Aprovação não encontrada.");
  }
  await ref.update({ revokedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  return { success: true };
});
