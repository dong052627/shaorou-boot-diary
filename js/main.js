import { Engine } from './core/engine.js';
import { Assets } from './core/assets.js';
import { TitleScene } from './scenes/title.js';

const engine = new Engine(document.getElementById('game'));
await Assets.loadAll();
engine.goto(new TitleScene());
engine.start();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
