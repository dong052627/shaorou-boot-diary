// 關卡流程:從關卡選擇進入某一關 → 先播前導劇情 → 主關卡 → 過關回到關卡選擇(並解鎖下一關)
import { State } from '../core/state.js';
import { NODES } from '../data/levels.js';
import { StoryScene } from './story.js';
import { MinigameScene } from './minigame.js';
import { WeekendScene } from './weekend.js';
import { EndingScene } from './ending.js';
import { LevelSelectScene } from './select.js';

const MAKERS = { minigame: MinigameScene, weekend: WeekendScene, ending: EndingScene };

export function playNode(engine, i, { dev = false } = {}) {
  const node = NODES[i], replay = !!State.cleared[node.id];
  const exit = () => engine.goto(new LevelSelectScene({ dev }));
  const finish = () => {
    const first = State.clearNode(i);
    engine.goto(new LevelSelectScene({ dev, unlockedNow: first && !dev && i + 1 < NODES.length ? i + 1 : -1 }));
  };
  const steps = [...node.pre, node.main];
  const run = k => {
    const l = steps[k];
    if (l.type === 'story') engine.goto(new StoryScene(l, () => run(k + 1), { onSkip: () => run(steps.length - 1) }));
    else engine.goto(new MAKERS[l.type](l, finish, { dev, replay, onExit: exit }));
  };
  run(0);
}
