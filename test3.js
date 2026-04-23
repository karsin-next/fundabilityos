async function run() {
  const res = await fetch("http://localhost:3000/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answers: { problem: "We help people test", revenue: 100 },
      userId: null
    })
  });
  console.log("Status:", res.status);
}
run();
