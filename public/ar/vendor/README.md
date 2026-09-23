# AR runtime dependencies

Locally hosted, unmodified browser distributions:

- MindAR 1.2.5: `mindar-image-three.prod.js`, `controller-mGt1s8dJ.js`, `ui-fBadYuor.js`.
  Source: https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/
- Three.js 0.160.0: `three.module.js`, `CSS3DRenderer.js`.
  Source: https://cdn.jsdelivr.net/npm/three@0.160.0/

Licenses are included alongside these files. The isolated iframe uses the import map
from MindAR's Three.js integration pattern and is destroyed when leaving AR.
