const fs = require('fs');
const path = 'src/pages/Landing.tsx';
let c = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// Find the hero content section and insert BVM Campus Management before the badge
const TARGET = "                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>\n                        <div className=\"inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground/80 mb-6 backdrop-blur-sm\">";

const REPLACEMENT = '                    {/* BVM Campus Management brand name */}\n' +
    '                    <motion.div\n' +
    '                        initial={{ opacity: 0, y: -10 }}\n' +
    '                        animate={{ opacity: 1, y: 0 }}\n' +
    '                        transition={{ duration: 0.8 }}\n' +
    '                        className="mb-4"\n' +
    '                    >\n' +
    '                        <h2\n' +
    "                            style={{ fontFamily: \"'Unbounded', sans-serif\", letterSpacing: '0.18em' }}\n" +
    '                            className="text-6xl md:text-8xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(168,85,247,0.4)]"\n' +
    '                        >\n' +
    '                            BVM Campus Management\n' +
    '                        </h2>\n' +
    '                    </motion.div>\n\n' +
    '                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>\n' +
    '                        <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground/80 mb-6 backdrop-blur-sm">';

if (c.includes(TARGET)) {
    c = c.replace(TARGET, REPLACEMENT);
    fs.writeFileSync(path, c, 'utf8');
    console.log('SUCCESS: BVM Campus Management brand name inserted');
} else {
    console.log('NOT FOUND - dumping search context:');
    const idx = c.indexOf('motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}');
    if (idx > -1) {
        console.log(JSON.stringify(c.substring(idx - 30, idx + 300)));
    }
}
