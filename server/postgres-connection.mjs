/** Shared by the API and maintenance tools. Credentials stay on the server. */
export function postgresConnection(connectionString, { ca } = {}) {
  if (!connectionString) throw new Error("Conexão PostgreSQL ausente.");
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("Conexão PostgreSQL inválida.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("A conexão precisa usar PostgreSQL.");
  // pg-connection-string can replace the SSL object when these options are present.
  // Always verify the certificate and hostname, including when a custom CA is used.
  for (const key of ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert", "uselibpqcompat"])
    url.searchParams.delete(key);
  const certificate = ca?.replace(/\\n/g, "\n").trim();
  if (certificate && !certificate.includes("-----BEGIN CERTIFICATE-----"))
    throw new Error("Certificado CA do PostgreSQL inválido.");
  return {
    connectionString: url.href,
    ssl: { rejectUnauthorized: true, ...(certificate ? { ca: certificate } : {}) },
    connectionTimeoutMillis: 10000,
  };
}
