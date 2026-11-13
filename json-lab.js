const researcher = {
  name: "Alex Morgan",
  email: "alex@university.edu",
  role: "researcher",
  active: true
};

const jsonData = JSON.stringify(researcher);
console.log("JSON sent to server:");
console.log(jsonData);

const receivedData = JSON.parse(jsonData);
console.log("Parsed object:");
console.log(receivedData);

console.log("Researcher email:");
console.log(receivedData.email);