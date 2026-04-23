const assessment = async () => {
  try {
    const res = await fetch("http://localhost:3000/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: { problem: "We help people test", revenue: 0 },
        userId: "5ab5dbd4-fa9a-4c91-9e73-b3c9b740523e" // Some fake UUID to test if it inserts
      })
    });
    console.log(res.status);
    const text = await res.text();
    console.log("Response text length:", text.length);
  } catch(e) {
    console.error(e);
  }
}
assessment();
