// 直線流程控制:依 State.step 取得 LEVELS 的當前一步,建立對應場景。
import { State } from '../core/state.js';
import { LEVELS } from '../data/levels.js';
import { StoryScene } from './story.js';
import { MinigameScene } from './minigame.js';
import { WeekendScene } from './weekend.js';
import { EndingScene } from './ending.js';
import { TitleScene } from './title.js';

const MAKERS = { story: StoryScene, minigame: MinigameScene, weekend: WeekendScene, ending: EndingScene };

export function runStep(engine) {
  const level = LEVELS[State.step] ?? LEVELS[LEVELS.length - 1];
  const done = level.type === 'ending' ? () => engine.goto(new TitleScene()) : () => next(engine);
  engine.goto(new MAKERS[level.type](level, done));
}
export function next(engine) {
  State.step = Math.min(State.step + 1, LEVELS.length - 1);
  State.save();
  runStep(engine);
}
