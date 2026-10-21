// Chép services + models của web (Fontend/src/app/features) sang Mobile/src/app/web trước khi build/serve.
// Web vẫn là nguồn duy nhất — KHÔNG sửa file trong src/app/web (bị ghi đè mỗi lần chạy).
// Lý do không import thẳng ../Fontend: bundler sẽ nạp Angular từ Fontend/node_modules → 2 bản Angular.
// Đường dẫn '../../../environments/environment' trong service tự trỏ tới Mobile/src/environments.
import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, '../Fontend/src/app/features');
const dest = resolve(root, 'src/app/web');

if (!existsSync(src)) {
  console.error(`[sync-web] Không tìm thấy ${src}`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
for (const dir of ['services', 'models']) {
  cpSync(resolve(src, dir), resolve(dest, dir), { recursive: true });
}
writeFileSync(
  resolve(dest, 'README.md'),
  '# Bản sao tự động\n\nChép từ `Fontend/src/app/features/{services,models}` bởi `scripts/sync-web.mjs`. Đừng sửa ở đây.\n',
);
console.log('[sync-web] services + models đã đồng bộ từ Fontend');
