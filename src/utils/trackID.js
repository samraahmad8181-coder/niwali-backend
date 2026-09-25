const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I ambiguity

function generateTrackId() {
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    return `NWL-${code}`;
}

module.exports = { generateTrackId };