export function getOwnerEmail() {
  return process.env.OWNER_EMAIL?.trim().toLowerCase() || null
}

// Fails closed: with OWNER_EMAIL unset, nobody is treated as the owner.
export function isOwnerEmail(email: string | null | undefined) {
  const owner = getOwnerEmail()
  return Boolean(owner && email && email.trim().toLowerCase() === owner)
}
