import { lazyComponent } from './lazy-component';

export const LabBoard = lazyComponent(() => import('../features/workspace/LabBoard.vue'));
export const LabWorkspace = lazyComponent(() => import('../features/workspace/LabWorkspace.vue'));
