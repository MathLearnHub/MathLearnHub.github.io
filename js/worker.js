let running = true;

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

onmessage = (e) => {
    if (e.data.type === "STOP") {
        running = false;
    }
};

async function loop() {
    while (running) {
        postMessage({ type: "CHECK_BAN" });
        await sleep(1000);
    }
}

loop();
