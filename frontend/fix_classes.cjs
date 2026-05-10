const fs = require('fs');
const files = [
  'src/pages/admin/LiveViewPage.jsx',
  'src/pages/admin/RecordingsPage.jsx',
  'src/pages/admin/UsersPage.jsx',
  'src/pages/admin/SettingsPage.jsx',
  'src/pages/admin/CamerasPage.jsx',
];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\banimate-card-enter\b/g, '');
  c = c.replace(/\banimate-slide-up\b/g, '');
  c = c.replace(/\bopacity-0-init\b/g, '');
  c = c.replace(/\bdelay-\d+\b/g, '');
  fs.writeFileSync(f, c);
  console.log('Fixed:', f);
});
