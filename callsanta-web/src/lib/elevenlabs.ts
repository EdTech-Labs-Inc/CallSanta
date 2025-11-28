/**
 * ElevenLabs Conversational AI - Outbound Call Functions
 * For transcription (STT), see transcription.ts
 */

interface CallData {
  childName: string;
  childAge: number;
  giftBudget: number; // Budget in dollars, 0-1000
  childInfoText?: string;
  childInfoVoiceTranscript?: string;
}

interface InitiateCallResponse {
  conversationId: string | null;
  callSid: string | null;
  success: boolean;
}

interface ConversationDetails {
  conversation_id: string;
  status: string;
  transcript?: string;
  metadata?: Record<string, unknown>;
  call_duration_secs?: number;
  agent_id: string;
}

/**
 * Initiates an outbound call via ElevenLabs Conversational AI + Twilio
 */
export async function initiateCall(
  toNumber: string,
  callData: CallData
): Promise<InitiateCallResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const phoneNumberId = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;

  if (!apiKey || !agentId || !phoneNumberId) {
    throw new Error('Missing ElevenLabs configuration (API key, agent ID, or phone number ID)');
  }

  const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: agentId,
      agent_phone_number_id: phoneNumberId,
      to_number: toNumber,
      conversation_initiation_client_data: {
        dynamic_variables: {
          child_name: callData.childName,
          child_age: callData.childAge.toString(),
          gift_budget: getGiftBudgetInstructions(callData.giftBudget),
          child_info: callData.childInfoText || '',
          voice_info: callData.childInfoVoiceTranscript || '',
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs call failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Note: API returns snake_case (call_sid) not camelCase (callSid)
  return {
    conversationId: data.conversation_id ?? null,
    callSid: data.call_sid ?? data.callSid ?? null,
    success: data.success ?? (!!data.conversation_id),
  };
}

/**
 * Fetches conversation details including transcript
 */
export async function getConversation(conversationId: string): Promise<ConversationDetails> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('Missing ELEVENLABS_API_KEY');
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
    {
      headers: { 'xi-api-key': apiKey },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get conversation: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Downloads the conversation audio recording
 */
export async function getConversationAudio(conversationId: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('Missing ELEVENLABS_API_KEY');
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
    {
      headers: { 'xi-api-key': apiKey },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get conversation audio: ${response.status} - ${errorText}`);
  }

  return response.arrayBuffer();
}

/**
 * Convert gift budget (in dollars) to natural language instructions for the agent
 */
function getGiftBudgetInstructions(budgetDollars: number): string {
  if (budgetDollars <= 50) {
    return "If the child asks for expensive gifts, gently suggest that Santa's elves are quite busy this year and maybe something smaller would be just as magical. Keep gift suggestions under $50.";
  } else if (budgetDollars <= 150) {
    return "Most reasonable gift requests are fine. For very expensive items over $150, suggest Santa will see what he can do.";
  } else if (budgetDollars <= 500) {
    return "Be generous with gift promises but stay realistic. Most gifts up to a few hundred dollars are fine to promise.";
  } else {
    return "Any gift request is acceptable to promise. The family has indicated a generous budget.";
  }
}
