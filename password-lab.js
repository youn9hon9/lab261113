const bcrypt = require("bcryptjs");
const password = "Research2026!";

const hash1 = bcrypt.hashSync(password, 10);
const hash2 = bcrypt.hashSync(password, 10);

console.log("First hash:", hash1);
console.log("Second hash:", hash2);
console.log("Are hashes identical?", hash1 === hash2);

const valid = bcrypt.compareSync("Research2026!", hash1);
const invalid = bcrypt.compareSync("WrongPassword!", hash1);

console.log("Correct password:", valid);
console.log("Incorrect password:", invalid);