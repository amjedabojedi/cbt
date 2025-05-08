import bcrypt from 'bcrypt';

async function hashPassword() {
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(`Password: ${password}`);
  console.log(`Hashed Password: ${hashedPassword}`);
}

hashPassword();