# End-to-End Encryption (E2EE) User Guide

## What is End-to-End Encryption?

End-to-End Encryption (E2EE) ensures that your writing is encrypted on your device **before** being uploaded to the cloud. This means:

- ✅ **Your data is encrypted locally** - Encryption happens on your device using your passphrase
- ✅ **The server can't read your content** - Inkwell servers only see encrypted data
- ✅ **Only you control the encryption key** - Your passphrase never leaves your device
- ✅ **Military-grade encryption** - Uses XChaCha20-Poly1305 AEAD cipher
- ❌ **No recovery if you forget passphrase** - We cannot recover your data without your passphrase

---

## Getting Started with E2EE

### Step 1: Enable E2EE for Your Project

1. Open **Settings** (gear icon in navigation)
2. Scroll to **End-to-End Encryption** section
3. Select the project you want to encrypt
4. Click **Enable E2EE for This Project**
5. Enter a strong passphrase (minimum 8 characters)
6. Confirm your passphrase
7. Click **Enable Encryption**

### Step 2: Save Your Recovery Kit

After enabling E2EE, you'll be prompted to download a **Recovery Kit**.

**What is a Recovery Kit?**

- A JSON file containing your encrypted project key
- Required to restore access if you lose your device or browser data
- Cannot decrypt your data without your passphrase
- Should be stored securely (password manager, encrypted drive)

**To download:**

1. Click **Export Recovery Kit** after enabling E2EE
2. Save the `.json` file to a secure location
3. **Do NOT share this file** - Anyone with this file + your passphrase can decrypt your data

---

## Daily Usage

### Unlocking Your Project

When you start a new session:

1. Navigate to your encrypted project
2. If locked, you'll see a prompt to enter your passphrase
3. Enter your passphrase to unlock
4. Your project will remain unlocked until you close the browser or manually lock it

### Locking Your Project

To lock your project:

1. Go to **Settings** > **End-to-End Encryption**
2. Click **Lock Project**
3. Your encryption keys are removed from memory
4. You'll need your passphrase to unlock again

**When to lock:**

- Before stepping away from your computer
- When sharing your device
- At the end of your writing session

---

## Managing Your Encryption

### Changing Your Passphrase

If you need to change your passphrase:

1. Make sure your project is **unlocked**
2. Go to **Settings** > **End-to-End Encryption**
3. Click **Change Passphrase**
4. Enter your **current** passphrase
5. Enter your **new** passphrase (minimum 8 characters)
6. Confirm your new passphrase
7. **Download your new Recovery Kit** - The old kit will no longer work!

### Exporting Recovery Kit

To backup your encryption key:

1. Make sure your project is **unlocked**
2. Go to **Settings** > **End-to-End Encryption**
3. Click **Export Recovery Kit**
4. Download the `.json` file
5. Store it in a secure location

**Best practices:**

- Export after changing your passphrase
- Keep multiple backups in different secure locations
- Never share via email or unencrypted chat

### Importing Recovery Kit

If you lose access to your encryption keys:

1. Go to **Settings** > **End-to-End Encryption**
2. Click **Import Recovery Kit**
3. Select your Recovery Kit `.json` file
4. Enter your passphrase
5. Click **Import Recovery Kit**
6. Your project will be unlocked and accessible again

---

## Security Best Practices

### Choosing a Strong Passphrase

✅ **Good passphrases:**

- Use 12+ characters
- Mix of words, numbers, and symbols
- Example: `correct-horse-battery-staple-2024!`
- Use a passphrase you can remember but others can't guess

❌ **Avoid:**

- Common words or phrases
- Personal information (birthdays, names)
- Reusing passwords from other sites
- Short passphrases (< 8 characters)

### Storing Your Recovery Kit

✅ **Secure storage:**

- Password manager (1Password, Bitwarden, LastPass)
- Encrypted cloud storage
- Physical USB drive in a safe location
- Encrypted external hard drive

❌ **Never store:**

- In plain text files
- In unencrypted email
- In public cloud storage without encryption
- On shared computers

### Protecting Your Passphrase

- **Never write it down** unless stored in a safe
- **Don't share it** with anyone, including Inkwell support
- **Use unique passphrase** for each encrypted project
- **Store separately** from Recovery Kit

---

## Troubleshooting

### "Incorrect passphrase" Error

**Possible causes:**

- Typo in passphrase (check Caps Lock)
- Using old passphrase after changing it
- Wrong Recovery Kit file

**Solution:**

- Double-check your passphrase
- Try your previous passphrase if you recently changed it
- Verify you're using the correct Recovery Kit

### "Project is locked" Error

**Cause:** Encryption keys not in memory

**Solution:**

1. Go to **Settings** > **End-to-End Encryption**
2. Click **Unlock Project**
3. Enter your passphrase

### "Decryption Failed" Error

**Possible causes:**

- Corrupted data
- Wrong encryption key
- Browser storage cleared

**Solution:**

1. Try importing your Recovery Kit
2. If issue persists, the encrypted data may be corrupted
3. Restore from a backup if available

### Lost Passphrase

**⚠️ IMPORTANT:** If you forget your passphrase and don't have a Recovery Kit, **your encrypted data cannot be recovered**.

**Prevention:**

- Save your Recovery Kit immediately after enabling E2EE
- Store passphrase in a password manager
- Keep backup of Recovery Kit in multiple secure locations

---

## Disabling E2EE

**⚠️ WARNING:** Disabling E2EE removes your encryption keys from your device. Existing encrypted data in the cloud remains encrypted.

To disable E2EE:

1. Make sure you have your **Recovery Kit** backed up
2. Go to **Settings** > **End-to-End Encryption**
3. Click **Disable E2EE (Remove Keys from Device)**
4. Confirm the action
5. Your keys are removed from this device

**To re-enable:**

- Import your Recovery Kit with your passphrase
- Or initialize E2EE again (creates new encryption keys)

---

## FAQ

### Does E2EE affect sync speed?

Encryption/decryption happens very quickly. You may notice a slight delay (< 1 second) when syncing, but it should not impact your writing experience.

### Can I use E2EE on multiple devices?

Yes! Use your Recovery Kit to set up E2EE on each device:

1. On new device, import your Recovery Kit
2. Enter your passphrase
3. You can now access encrypted data on this device

### What data is encrypted?

- Chapter content (title and body)
- **NOT encrypted:** Project metadata (name, creation date), chapter order

### Can Inkwell support help if I lose my passphrase?

No. By design, Inkwell staff cannot decrypt your data. This is what makes E2EE secure.

### What happens if I don't enable E2EE?

Your data is still stored securely, but it's accessible by Inkwell servers. Without E2EE, your data is encrypted in transit and at rest, but the server can decrypt it.

### Can I disable E2EE later?

Yes, but encrypted data remains encrypted in the cloud. You'll need your Recovery Kit to re-enable access later.

---

## Technical Details

For developers and security researchers:

- **Encryption algorithm:** XChaCha20-Poly1305 AEAD
- **Key derivation:** Argon2id (memory-hard, GPU-resistant)
- **Key size:** 256 bits
- **Nonce size:** 192 bits (XChaCha20)
- **Salt size:** 128 bits
- **KDF iterations:** Interactive (for performance) or Moderate (for security)
- **Data encrypted:** Chapter title and body
- **Storage:** DEK (Data Encryption Key) wrapped with passphrase-derived master key, stored in IndexedDB

---

## Need Help?

- **Documentation:** [Inkwell Docs](https://docs.inkwell.app)
- **GitHub Issues:** [Report a bug](https://github.com/inkwell/inkwell/issues)
- **Security concerns:** security@inkwell.app

**Remember:** Always keep your passphrase and Recovery Kit safe. Inkwell cannot recover your data if you lose both.
