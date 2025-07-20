import { meetingsRouter } from '@/modules/meetings/server/procedures';
import { agentsRouter } from '@/modules/agents/server/procedures';
import { chatRouter } from '@/modules/chat/server/procedures';

import { createTRPCRouter } from '../init';

export const appRouter = createTRPCRouter({
  agents: agentsRouter,
  meetings: meetingsRouter,
  chat: chatRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;