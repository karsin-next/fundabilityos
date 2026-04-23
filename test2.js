async function run() {
  const res = await fetch("http://localhost:3000/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answers: { problem: "We help people test", revenue: 100 },
      userId: "d8cc47f6-6c17-48f5-9372-b88a91cbb8a9" // random valid-looking UUID
    })
  });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response len:", text.length);
}
run();
