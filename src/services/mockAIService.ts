// src/services/mockAIService.ts
import { generateId } from '../utils/id';

import type { ClaudeResponse, ClaudeMessage } from './claudeService';
import type { AnalyzeBoardInput, PlotAnalysis } from '../types/plotAnalysis';

interface MockResponse {
  delay: number;
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

class MockAIService {
  private readonly MIN_DELAY = 800;
  private readonly MAX_DELAY = 2500;
  private responseCount = 0;

  // Mock responses for different types of requests
  private readonly MOCK_RESPONSES: Record<string, MockResponse[]> = {
    // General chat responses
    general: [
      {
        delay: 1200,
        content:
          "I'd be happy to help you with your writing! What specific aspect would you like to work on today?",
        usage: { inputTokens: 25, outputTokens: 23 },
      },
      {
        delay: 1500,
        content:
          "That's an interesting direction for your story. Have you considered how this might affect your character's motivation?",
        usage: { inputTokens: 30, outputTokens: 28 },
      },
      {
        delay: 1000,
        content:
          'Let me help you explore that idea further. What themes are you trying to convey in this scene?',
        usage: { inputTokens: 28, outputTokens: 24 },
      },
    ],

    // Text continuation responses
    continue: [
      {
        delay: 1800,
        content:
          "The shadows lengthened as evening approached, and Sarah knew she had to make a decision. Her heart pounded as she reached for the door handle, knowing that whatever lay beyond would change everything. The weight of her choice pressed down on her shoulders like a physical burden, but she couldn't turn back now—too much depended on her courage.",
        usage: { inputTokens: 45, outputTokens: 67 },
      },
      {
        delay: 2000,
        content:
          "With trembling hands, Marcus opened the letter that would seal his fate. The words blurred before his eyes as he read them once, then twice, unable to believe what he was seeing. This wasn't how things were supposed to end. He crumpled the paper, then smoothed it out again, as if the gesture could somehow change the reality of what he'd just read.",
        usage: { inputTokens: 40, outputTokens: 71 },
      },
      {
        delay: 1600,
        content:
          "The old lighthouse stood sentinel against the storm, its beacon cutting through the darkness with determined regularity. Emma pulled her coat tighter as she climbed the winding stairs, each step echoing in the narrow tower. At the top, she found what she'd been searching for—and realized she wasn't alone.",
        usage: { inputTokens: 35, outputTokens: 58 },
      },
    ],

    // Text improvement responses
    improve: [
      {
        delay: 1400,
        content:
          'Here\'s a revised version with stronger imagery and more engaging flow:\n\n"The ancient oak\'s gnarled branches reached toward the storm-darkened sky like desperate fingers, while rain hammered against the windows with relentless fury. Sarah pressed her face to the glass, watching lightning illuminate the garden in stark, electric moments. Each thunderclap seemed to echo the turmoil in her heart—she knew tonight would change everything."',
        usage: { inputTokens: 55, outputTokens: 78 },
      },
      {
        delay: 1700,
        content:
          'Consider this enhanced version that adds emotional depth and sensory details:\n\n"The courthouse steps felt cold beneath David\'s feet as he paused, briefcase in hand. The weight of three years\' worth of evidence pressed against his palm, while doubt gnawed at his resolve. Around him, the city hummed with its usual indifference—car horns blaring, voices mixing into urban white noise. But for David, this moment crystallized into perfect, terrifying clarity."',
        usage: { inputTokens: 48, outputTokens: 85 },
      },
    ],

    // Style analysis responses
    analyze: [
      {
        delay: 2200,
        content:
          '**Writing Style Analysis:**\n\n**Tone:** Contemplative and introspective, with undertones of tension\n**Voice:** Third-person limited with close psychological distance\n**Pacing:** Deliberate and measured, allowing for character reflection\n**Literary Devices:** \n- Effective use of imagery ("shadows lengthened")\n- Metaphorical language ("weight of her choice")\n- Sensory details that ground the reader\n\n**Strengths:** Strong character interiority, atmospheric description\n**Suggestions:** Consider varying sentence length for more dynamic rhythm',
        usage: { inputTokens: 60, outputTokens: 112 },
      },
    ],

    // Plot idea responses
    plot: [
      {
        delay: 2000,
        content:
          "**Story Ideas:**\n\n1. **The Memory Thief** - A detective who can absorb others' memories discovers their own past has been stolen\n\n2. **Underground Gardens** - In a post-apocalyptic world, secret gardeners preserve Earth's botanical heritage\n\n3. **The Last Library** - A librarian guards humanity's final collection of physical books against digital erasure\n\n4. **Time Debt** - People can borrow time from their future selves, but the interest rates are deadly\n\n5. **The Empathy Engine** - A device that lets people truly feel others' emotions threatens to tear society apart",
        usage: { inputTokens: 35, outputTokens: 98 },
      },
    ],

    // Character analysis responses
    character: [
      {
        delay: 1900,
        content:
          '**Character Analysis Framework:**\n\n**Core Personality Traits:**\n- Determined yet self-doubting\n- Empathetic but guarded\n- Intelligent with blind spots about emotions\n\n**Potential Backstory Elements:**\n- Early loss that created trust issues\n- Academic or professional success masking personal struggles\n- A defining moment where helping others came at personal cost\n\n**Character Arc Possibilities:**\n- Learning to trust others again\n- Balancing personal needs with desire to help\n- Discovering strength through vulnerability\n\n**Internal Conflicts:**\n- Fear of abandonment vs. need for connection\n- Professional duty vs. personal happiness\n- Past trauma vs. future possibilities',
        usage: { inputTokens: 45, outputTokens: 134 },
      },
    ],

    // Brainstorming responses
    brainstorm: [
      {
        delay: 1600,
        content:
          "**Creative Brainstorming Ideas:**\n\n**Angles to Explore:**\n- What if the opposite were true?\n- How would different cultures approach this?\n- What's the perspective we haven't considered?\n\n**Potential Themes:**\n- The cost of progress\n- Hidden connections between strangers\n- The power of small acts of kindness\n\n**Story Directions:**\n- Multiple timeline convergence\n- Unreliable narrator revelation\n- Role reversal between protagonist/antagonist\n\n**Character Dynamics:**\n- Enemies forced to work together\n- Mentor who needs to learn from student\n- Siblings with opposing worldviews",
        usage: { inputTokens: 40, outputTokens: 108 },
      },
    ],

    // Story generation (comprehensive outlines)
    story_outline: [
      {
        delay: 4000,
        content: `{
  "title": "The Digital Archaeologist",
  "genre": "Science Fiction",
  "summary": "In 2087, Dr. Elena Vasquez discovers that deleted digital memories from the early 21st century contain the key to preventing humanity's impending extinction.",
  "themes": ["memory", "technology", "human connection", "preservation of culture"],
  "plotPoints": [
    "Elena discovers anomalous data patterns in deleted social media archives",
    "She realizes the data contains actual human memories, not just posts",
    "A shadowy organization tries to stop her research",
    "Elena must choose between her safety and saving humanity's forgotten past",
    "The memories reveal a solution to the current ecological crisis"
  ],
  "characters": [
    {
      "name": "Dr. Elena Vasquez",
      "role": "protagonist",
      "description": "A brilliant but isolated data archaeologist in her late 30s",
      "motivation": "Preserve human history and culture in digital form",
      "conflict": "Must overcome her fear of emotional connections to save humanity",
      "arc": "Learns that human connection is more valuable than any digital archive"
    },
    {
      "name": "Marcus Chen",
      "role": "supporting",
      "description": "Elena's former colleague turned corporate security chief",
      "motivation": "Protect corporate interests while maintaining his humanity",
      "conflict": "Torn between loyalty to Elena and duty to his employers",
      "arc": "Rediscovers his principles and helps Elena despite the cost"
    }
  ],
  "chapters": [
    {
      "title": "Deleted Memories",
      "summary": "Elena discovers strange patterns in archived social media data that shouldn't exist.",
      "plotFunction": "Setup",
      "wordTarget": 2500,
      "scenes": [
        {
          "title": "The Anomaly",
          "summary": "Elena notices data that defies conventional understanding of digital storage.",
          "purpose": "Establish the inciting incident and Elena's expertise",
          "conflict": "Elena's curiosity versus institutional skepticism"
        }
      ]
    }
  ]
}`,
        usage: { inputTokens: 150, outputTokens: 420 },
      },
    ],

    // Consistency analysis responses
    consistency: [
      {
        delay: 3500,
        content: `[
  {
    "type": "character",
    "severity": "medium",
    "title": "Character Voice Inconsistency",
    "description": "In Chapter 2, Sarah speaks in formal, educated language, but in Chapter 5 she uses very casual colloquialisms without explanation for the change.",
    "suggestion": "Either establish that Sarah adapts her speech to different situations, or maintain consistency in her vocabulary throughout.",
    "locationInfo": {
      "chapterId": "chapter-5",
      "characterId": "sarah",
      "pageReference": "Chapter 5, Scene 2"
    }
  },
  {
    "type": "timeline",
    "severity": "high",
    "title": "Timeline Contradiction",
    "description": "Chapter 3 mentions it's been 'three months since the incident' but Chapter 4 refers to 'the event last week'.",
    "suggestion": "Clarify the timeline by establishing clear dates or time markers for major events.",
    "locationInfo": {
      "chapterId": "chapter-4",
      "pageReference": "Chapter 4, opening"
    }
  }
]`,
        usage: { inputTokens: 200, outputTokens: 180 },
      },
    ],
  };

  /**
   * Generate a mock response based on request content
   */
  async generateMockResponse(content: string, context?: any): Promise<ClaudeResponse> {
    const responseType = this.detectResponseType(content);
    const mockResponses = this.MOCK_RESPONSES[responseType] || this.MOCK_RESPONSES.general;

    if (!mockResponses || mockResponses.length === 0) {
      throw new Error(`No mock responses available for type: ${responseType}`);
    }

    // Select response based on rotation to provide variety
    const selectedResponse = mockResponses[this.responseCount % mockResponses.length];
    if (!selectedResponse) {
      throw new Error(`Invalid mock response selected for type: ${responseType}`);
    }

    this.responseCount++;

    // Add some randomness to delay for more realistic feel
    const delay = selectedResponse.delay + (Math.random() * 500 - 250);

    // Simulate API delay
    await this.sleep(Math.max(this.MIN_DELAY, Math.min(this.MAX_DELAY, delay)));

    // Simulate occasional "errors" to test error handling (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Mock API temporarily unavailable - testing error handling');
    }

    const responseContent = this.personalizeResponse(selectedResponse.content, context);

    return {
      content: responseContent,
      text: responseContent,
      trim: () => responseContent.trim(),
      usage: selectedResponse.usage,
    };
  }

  /**
   * Generate mock conversation history for testing
   */
  generateMockMessages(): ClaudeMessage[] {
    return [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Can you help me improve this dialogue?',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content:
          "I'd be happy to help improve your dialogue! Please share the specific conversation you'd like me to review, and I'll provide suggestions for making it more natural and engaging.",
        timestamp: new Date(Date.now() - 295000),
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'How can I make my characters sound more distinct from each other?',
        timestamp: new Date(Date.now() - 120000), // 2 minutes ago
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content:
          'Great question! Here are some techniques to create distinct character voices:\n\n1. **Vocabulary choices** - Give each character a unique lexicon\n2. **Sentence structure** - Some speak in short bursts, others in long, flowing sentences\n3. **Cultural background** - Reflect their upbringing and education\n4. **Emotional expression** - How they handle feelings differently\n5. **Speech patterns** - Unique phrases, interruptions, or hesitations\n\nWould you like me to analyze some specific dialogue examples?',
        timestamp: new Date(Date.now() - 115000),
      },
    ];
  }

  /**
   * Check if mock mode should be active
   */
  shouldUseMockMode(): boolean {
    // Check if we're in development or demo mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasApiKey = localStorage.getItem('claude_api_key_encrypted');

    return isDevelopment && !hasApiKey;
  }

  // Private methods

  private detectResponseType(content: string): string {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('continue') && lowerContent.includes('text')) {
      return 'continue';
    }
    if (lowerContent.includes('improve') || lowerContent.includes('enhance')) {
      return 'improve';
    }
    if (lowerContent.includes('analyze') && lowerContent.includes('style')) {
      return 'analyze';
    }
    if (lowerContent.includes('plot') && lowerContent.includes('idea')) {
      return 'plot';
    }
    if (lowerContent.includes('character')) {
      return 'character';
    }
    if (lowerContent.includes('brainstorm')) {
      return 'brainstorm';
    }
    if (lowerContent.includes('outline') || lowerContent.includes('story architect')) {
      return 'story_outline';
    }
    if (lowerContent.includes('consistency') || lowerContent.includes('guardian')) {
      return 'consistency';
    }

    return 'general';
  }

  private personalizeResponse(response: string, context?: any): string {
    if (!context) return response;

    let personalized = response;

    // Replace placeholders with context if available
    if (context.selectedText && response.includes('[SELECTED_TEXT]')) {
      personalized = personalized.replace(
        '[SELECTED_TEXT]',
        context.selectedText.slice(0, 100) + (context.selectedText.length > 100 ? '...' : ''),
      );
    }

    if (context.projectContext && response.includes('[PROJECT]')) {
      personalized = personalized.replace('[PROJECT]', context.projectContext);
    }

    if (context.sceneTitle && response.includes('[SCENE]')) {
      personalized = personalized.replace('[SCENE]', context.sceneTitle);
    }

    return personalized;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get mock status for monitoring
   */
  getStatus() {
    return {
      isHealthy: true,
      responseTime: Math.floor(Math.random() * 1000) + 500, // 500-1500ms
      tokensRemaining: Math.floor(Math.random() * 5000) + 10000, // 10k-15k
      requestsThisMinute: Math.floor(Math.random() * 20) + 5, // 5-25
      lastError: null,
      mode: 'mock',
    };
  }

  /**
   * Generate mock AI configuration for testing
   */
  getMockConfig() {
    return {
      model: 'claude-sonnet-mock',
      maxTokens: 4000,
      temperature: 0.7,
      isConfigured: true,
      isValid: true,
      keyMasked: 'sk-ant-mock-••••••••••••',
    };
  }
}

/**
 * Mock plot analysis for development and testing
 */
export async function _mockAnalyzeBoard(input: AnalyzeBoardInput): Promise<PlotAnalysis> {
  // Simulate some processing delay
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));

  const pacing = input.scenes.map((s, _i) => ({
    sceneId: s.id,
    index: i,
    tension: Math.abs(Math.sin(i)),
    pace: Math.abs(Math.cos(i)),
  }));

  return {
    id: generateId('analysis'),
    profileId: input.profileId,
    projectId: input.projectId,
    model: 'mock',
    updatedAt: Date.now(),
    summary:
      'Mock analysis summary. This is a demonstration of the AI plot analysis feature with realistic-looking insights.',
    qualityScore: Math.floor(Math.random() * 30) + 65, // 65-95 range
    issues: [
      {
        id: generateId('issue'),
        type: 'continuity_gap',
        severity: 'medium',
        title: 'Time jump between scenes needs clarification',
        description:
          "There's an unclear time passage between scenes that could confuse readers. Consider adding a transition or time anchor.",
        sceneIds: input.scenes
          .slice(
            Math.max(0, Math.floor(input.scenes.length / 2) - 1),
            Math.floor(input.scenes.length / 2) + 1,
          )
          .map((s) => s.id),
        suggestions: [
          'Add a time anchor line at the beginning of the later scene',
          'Show consequences from the previous scene to bridge the gap',
        ],
      },
      {
        id: generateId('issue'),
        type: 'pacing_spike',
        severity: 'low',
        title: 'Pacing could be more varied',
        description:
          'Consider varying sentence length and paragraph structure to create more dynamic pacing.',
        sceneIds: input.scenes.slice(0, 2).map((s) => s.id),
        suggestions: [
          'Mix short, punchy sentences with longer descriptive ones',
          'Use paragraph breaks to control reading rhythm',
        ],
      },
    ],
    pacing,
    conflictHeatmap: pacing.map((p, _i) => ({
      row: Math.floor(i / 3),
      col: i % 3,
      value: p.tension * 0.7 + Math.random() * 0.3,
    })),
  };
}

export const mockAIService = new MockAIService();
export default mockAIService;
