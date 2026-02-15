import { getEnabledAnimalTypes } from '@/features/system-setting/actions';
import ChatContainer from '@/features/ai-report/components/chat/ChatContainer';

export default async function AiReportPage() {
  const enabledAnimalTypes = await getEnabledAnimalTypes();

  return <ChatContainer enabledAnimalTypes={enabledAnimalTypes} />;
}
