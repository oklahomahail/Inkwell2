// src/components/Planning/CharacterArcDemo.tsx - Demo showcase of Character Arc Management features
import { useState } from 'react';
import React from 'react';

import CharacterArcManager from './CharacterArcManager';

import type { GeneratedCharacter } from '../../services/storyArchitectService';

// Sample character data to showcase the features
const sampleCharacters: GeneratedCharacter[] = [
  {
    name: 'Elena Stormwind',
    role: 'protagonist',
    description:
      'A young mage struggling to control her growing powers while navigating the political intrigue of the Royal Academy.',
    backstory:
      'Born in a small village to humble farmers, Elena discovered her magical abilities when they saved her family from bandits.',
    motivation:
      'To master her powers and protect those she loves from the growing darkness threatening the kingdom.',
    arc: 'transformation from insecure novice to confident leader and protector',
    internalConflict: 'Fear of her own power and potential to harm others',
    externalConflict:
      'Must stop a cult from awakening an ancient evil while navigating academy politics',
    conflict: 'Struggles with self-doubt while facing external magical threats',
    povChapters: [1, 3, 7, 11, 15, 18, 20],
    arcStages: [
      {
        stage: 'ordinary_world',
        chapter: 1,
        description:
          'Elena arrives at the Royal Academy, feeling out of place among noble-born students.',
        growth: 'establishment',
        internalState: 'overwhelmed',
        externalChallenge: 'social_adjustment',
      },
      {
        stage: 'inciting_incident',
        chapter: 3,
        description:
          'Elena accidentally unleashes a powerful spell during class, revealing her unusual abilities.',
        growth: 'awakening',
        internalState: 'frightened',
        externalChallenge: 'unwanted_attention',
      },
      {
        stage: 'first_threshold',
        chapter: 7,
        description: 'Elena joins a secret investigation into mysterious magical disturbances.',
        growth: 'commitment',
        internalState: 'determined',
        externalChallenge: 'dangerous_mystery',
      },
      {
        stage: 'tests_and_trials',
        chapter: 11,
        description:
          'Elena faces her first real battle against cult members, learning to trust her powers.',
        growth: 'development',
        internalState: 'tested',
        externalChallenge: 'magical_combat',
      },
      {
        stage: 'climax',
        chapter: 15,
        description:
          "Elena confronts the cult leader in a magical duel that will determine the kingdom's fate.",
        growth: 'crisis',
        internalState: 'desperate',
        externalChallenge: 'ultimate_test',
      },
      {
        stage: 'resolution',
        chapter: 18,
        description:
          'Elena defeats the cult but realizes the greater responsibility that comes with her power.',
        growth: 'victory',
        internalState: 'mature',
        externalChallenge: 'new_responsibilities',
      },
      {
        stage: 'new_equilibrium',
        chapter: 20,
        description:
          'Elena becomes a mentor to younger students while preparing for greater challenges ahead.',
        growth: 'mastery',
        internalState: 'confident',
        externalChallenge: 'leadership',
      },
    ],
    relationships: [
      {
        withCharacter: 'Marcus Ironheart',
        type: 'ally',
        arcInfluence: 'major',
      },
      {
        withCharacter: 'Lord Shadowmere',
        type: 'enemy',
        arcInfluence: 'major',
      },
      {
        withCharacter: 'Professor Willowmere',
        type: 'mentor',
        arcInfluence: 'moderate',
      },
      {
        withCharacter: 'Aria Moonwhisper',
        type: 'love_interest',
        arcInfluence: 'moderate',
      },
    ],
    voiceProfile: {
      vocabulary: 'formal',
      sentenceLength: 'medium',
      emotionalExpression: 'reserved',
      speechPatterns: ['Uses magical terminology', 'Speaks with growing confidence'],
      distinctiveTraits: ['Thoughtful pauses', 'Protective of friends', 'Academic precision'],
    },
    growthMoments: [
      'First successful spell in combat',
      'Standing up to academy bullies',
      'Accepting leadership role',
      'Making the ultimate sacrifice',
    ],
  },
  {
    name: 'Marcus Ironheart',
    role: 'supporting',
    description:
      "Elena's loyal friend and fellow student, a skilled swordsman from a military family.",
    backstory:
      "Son of a decorated general, Marcus chose the Academy over military service to his father's disappointment.",
    motivation: 'To prove that honor and loyalty matter more than family expectations.',
    arc: 'learning to balance duty to family with personal convictions',
    internalConflict: 'Torn between family duty and personal beliefs',
    externalConflict: 'Must choose between family expectations and supporting Elena',
    conflict: 'Family pressure versus personal loyalty',
    povChapters: [5, 9, 13, 17],
    arcStages: [
      {
        stage: 'introduction',
        chapter: 1,
        description: 'Marcus is introduced as the dutiful son trying to live up to family legacy.',
        growth: 'establishment',
        internalState: 'conflicted',
        externalChallenge: 'family_pressure',
      },
      {
        stage: 'growing_bond',
        chapter: 5,
        description:
          'Marcus forms a close friendship with Elena, finding someone who values him for himself.',
        growth: 'bonding',
        internalState: 'loyal',
        externalChallenge: 'friendship_vs_duty',
      },
      {
        stage: 'major_choice',
        chapter: 9,
        description:
          "Marcus defies his father's orders to continue supporting Elena's investigation.",
        growth: 'rebellion',
        internalState: 'resolved',
        externalChallenge: 'family_confrontation',
      },
      {
        stage: 'sacrifice',
        chapter: 13,
        description: 'Marcus risks his life to protect Elena during a dangerous mission.',
        growth: 'heroism',
        internalState: 'brave',
        externalChallenge: 'life_threat',
      },
      {
        stage: 'resolution',
        chapter: 17,
        description: 'Marcus finds a way to honor both his family and his convictions.',
        growth: 'integration',
        internalState: 'balanced',
        externalChallenge: 'reconciliation',
      },
    ],
    relationships: [
      {
        withCharacter: 'Elena Stormwind',
        type: 'ally',
        arcInfluence: 'major',
      },
      {
        withCharacter: 'General Ironheart',
        type: 'family',
        arcInfluence: 'major',
      },
      {
        withCharacter: 'Aria Moonwhisper',
        type: 'ally',
        arcInfluence: 'minor',
      },
    ],
    voiceProfile: {
      vocabulary: 'simple',
      sentenceLength: 'short',
      emotionalExpression: 'direct',
      speechPatterns: ['Military terminology', 'Straightforward commands'],
      distinctiveTraits: ['Honor-focused', 'Protective instincts', 'Dry humor'],
    },
    growthMoments: [
      'First act of defiance against father',
      'Choosing friendship over family approval',
      'Leading a rescue mission',
    ],
  },
  {
    name: 'Lord Shadowmere',
    role: 'antagonist',
    description:
      'A former academy professor turned cult leader, seeking to awaken an ancient evil for personal power.',
    backstory: 'Once a respected scholar until his research into forbidden magic corrupted him.',
    motivation: 'To gain ultimate power by releasing an ancient demon and controlling it.',
    arc: 'descent from respected teacher to dangerous villain',
    internalConflict: 'Remnants of his former moral self fighting against corruption',
    externalConflict: "Must overcome academy defenses and Elena's growing power",
    conflict: 'Former noble intentions corrupted by dark magic',
    povChapters: [6, 10, 14],
    arcStages: [
      {
        stage: 'introduction',
        chapter: 2,
        description: 'Shadowmere appears as a helpful mentor figure, hiding his true intentions.',
        growth: 'deception',
        internalState: 'manipulative',
        externalChallenge: 'maintaining_facade',
      },
      {
        stage: 'revelation',
        chapter: 6,
        description: "Shadowmere's true nature is revealed as he begins the awakening ritual.",
        growth: 'unmasking',
        internalState: 'ruthless',
        externalChallenge: 'accelerated_timeline',
      },
      {
        stage: 'escalation',
        chapter: 10,
        description: 'Shadowmere gains more power and becomes increasingly dangerous and unstable.',
        growth: 'corruption',
        internalState: 'consumed',
        externalChallenge: 'growing_opposition',
      },
      {
        stage: 'final_confrontation',
        chapter: 14,
        description: 'Shadowmere attempts to complete his ritual while fighting Elena.',
        growth: 'desperation',
        internalState: 'obsessed',
        externalChallenge: 'ultimate_plan',
      },
      {
        stage: 'downfall',
        chapter: 15,
        description: 'Shadowmere is defeated, his corruption ultimately destroying him.',
        growth: 'destruction',
        internalState: 'broken',
        externalChallenge: 'final_defeat',
      },
    ],
    relationships: [
      {
        withCharacter: 'Elena Stormwind',
        type: 'enemy',
        arcInfluence: 'major',
      },
      {
        withCharacter: 'Professor Willowmere',
        type: 'enemy',
        arcInfluence: 'moderate',
      },
      {
        withCharacter: 'Aria Moonwhisper',
        type: 'enemy',
        arcInfluence: 'minor',
      },
    ],
    voiceProfile: {
      vocabulary: 'complex',
      sentenceLength: 'long',
      emotionalExpression: 'theatrical',
      speechPatterns: ['Grandiose speeches', 'Dark magical incantations'],
      distinctiveTraits: [
        'Intellectual pride',
        'Increasing instability',
        'Former teacher mannerisms',
      ],
    },
    growthMoments: [
      'First use of forbidden magic',
      'Betraying former colleagues',
      'Embracing full corruption',
      'Final desperate gambit',
    ],
  },
  {
    name: 'Aria Moonwhisper',
    role: 'supporting',
    description:
      "A talented healer and Elena's romantic interest, torn between her pacifist beliefs and the need to fight.",
    backstory: 'Raised in a peaceful monastery, Aria came to the Academy to learn healing magic.',
    motivation: 'To use her powers to heal and protect while staying true to her peaceful nature.',
    arc: 'learning that sometimes violence is necessary to protect peace',
    internalConflict: 'Pacifist beliefs conflicting with need to fight evil',
    externalConflict: 'Pressure to use healing magic for combat purposes',
    conflict: 'Balancing healing nature with combat necessity',
    povChapters: [4, 8, 12, 16, 19],
    arcStages: [
      {
        stage: 'introduction',
        chapter: 2,
        description: 'Aria is introduced as a gentle healer who abhors violence.',
        growth: 'establishment',
        internalState: 'peaceful',
        externalChallenge: 'combat_expectations',
      },
      {
        stage: 'first_conflict',
        chapter: 4,
        description: 'Aria struggles with pressure to use her magic in combat situations.',
        growth: 'tension',
        internalState: 'conflicted',
        externalChallenge: 'moral_dilemma',
      },
      {
        stage: 'compromise',
        chapter: 8,
        description: 'Aria finds ways to help in combat while maintaining her healing focus.',
        growth: 'adaptation',
        internalState: 'creative',
        externalChallenge: 'tactical_contribution',
      },
      {
        stage: 'major_choice',
        chapter: 12,
        description: "Aria must choose between her principles and saving Elena's life.",
        growth: 'sacrifice',
        internalState: 'determined',
        externalChallenge: 'life_death_decision',
      },
      {
        stage: 'resolution',
        chapter: 16,
        description: 'Aria learns to balance her healing nature with protective action.',
        growth: 'integration',
        internalState: 'wise',
        externalChallenge: 'leadership_role',
      },
      {
        stage: 'new_purpose',
        chapter: 19,
        description: 'Aria becomes a leader in developing defensive healing techniques.',
        growth: 'mastery',
        internalState: 'confident',
        externalChallenge: 'teaching_others',
      },
    ],
    relationships: [
      {
        withCharacter: 'Elena Stormwind',
        type: 'love_interest',
        arcInfluence: 'major',
      },
      {
        withCharacter: 'Marcus Ironheart',
        type: 'ally',
        arcInfluence: 'minor',
      },
      {
        withCharacter: 'Professor Willowmere',
        type: 'mentor',
        arcInfluence: 'moderate',
      },
    ],
    voiceProfile: {
      vocabulary: 'gentle',
      sentenceLength: 'medium',
      emotionalExpression: 'empathetic',
      speechPatterns: ['Calming phrases', 'Healing terminology'],
      distinctiveTraits: ['Soft-spoken', 'Emotionally intuitive', 'Nature references'],
    },
    growthMoments: [
      'First time using magic to harm',
      'Saving Elena despite personal cost',
      'Teaching others defensive healing',
      'Accepting leadership role',
    ],
  },
  {
    name: 'Professor Willowmere',
    role: 'supporting',
    description:
      "Elena's wise mentor and Head of Magical Studies, hiding secrets about the academy's past.",
    backstory:
      'A former adventurer who settled into teaching after a traumatic encounter with dark magic.',
    motivation: 'To guide the next generation while protecting them from the mistakes of the past.',
    arc: 'revealing hidden knowledge and finding redemption for past failures',
    internalConflict: 'Guilt over past failures affecting current teaching',
    externalConflict: 'Must reveal dangerous secrets to help students',
    conflict: 'Past trauma influencing present decisions',
    povChapters: [2],
    arcStages: [
      {
        stage: 'introduction',
        chapter: 1,
        description: 'Professor Willowmere appears as a wise but mysterious teacher.',
        growth: 'establishment',
        internalState: 'guarded',
        externalChallenge: 'maintaining_secrets',
      },
      {
        stage: 'revelation',
        chapter: 8,
        description: "Willowmere begins revealing the academy's hidden history to Elena.",
        growth: 'disclosure',
        internalState: 'reluctant',
        externalChallenge: 'dangerous_knowledge',
      },
      {
        stage: 'redemption',
        chapter: 16,
        description: 'Willowmere helps Elena succeed where she once failed.',
        growth: 'resolution',
        internalState: 'redeemed',
        externalChallenge: 'final_assistance',
      },
    ],
    relationships: [
      {
        withCharacter: 'Elena Stormwind',
        type: 'mentor',
        arcInfluence: 'major',
      },
      {
        withCharacter: 'Lord Shadowmere',
        type: 'enemy',
        arcInfluence: 'major',
      },
      {
        withCharacter: 'Aria Moonwhisper',
        type: 'mentor',
        arcInfluence: 'moderate',
      },
    ],
    voiceProfile: {
      vocabulary: 'academic',
      sentenceLength: 'long',
      emotionalExpression: 'measured',
      speechPatterns: ['Historical references', 'Teaching metaphors'],
      distinctiveTraits: ['Patient explanations', 'Hidden wisdom', 'Protective concern'],
    },
    growthMoments: [
      'Deciding to train Elena',
      'Revealing academy secrets',
      'Facing Shadowmere again',
    ],
  },
];

export default function CharacterArcDemo() {
  const [characters, setCharacters] = useState<GeneratedCharacter[]>(sampleCharacters);

  const handleCharacterUpdate = (updatedCharacter: GeneratedCharacter) => {
    setCharacters((prev) =>
      prev.map((char) => (char.name === updatedCharacter.name ? updatedCharacter : char)),
    );
  };

  const handleAddCharacter = () => {
    console.log('Add character functionality would be implemented here');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Demo Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Character Arc Management Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Explore advanced character development tools with interactive features
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-blue-800 dark:text-blue-200">
            <p className="text-sm">
              This demo showcases all Character Arc Management features using sample data from a
              fantasy academy story. Try different views, drag timeline elements, explore
              relationships, and preview arc templates!
            </p>
          </div>
        </div>

        {/* Character Arc Manager */}
        <CharacterArcManager
          characters={characters}
          totalChapters={20}
          onCharacterUpdate={handleCharacterUpdate}
          onAddCharacter={handleAddCharacter}
        />

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              🎯 Interactive Arc Editor
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag and drop arc stages to adjust timing, see real-time pacing analysis, and
              visualize character development across chapters.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              📚 Arc Templates Library
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose from proven character arc patterns including Hero's Journey, Redemption Arc,
              Romance Arc, and more.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              🕸️ Relationship Mapping
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Visualize character connections with an interactive network diagram showing allies,
              enemies, mentors, and love interests.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">How to Use This Demo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Overview Tab</h3>
              <ul className="space-y-1">
                <li>• View character summaries and development scores</li>
                <li>• See relationship counts and POV chapters</li>
                <li>• Click characters to see detailed information</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Arc Editor Tab</h3>
              <ul className="space-y-1">
                <li>• Drag timeline markers to adjust chapter timing</li>
                <li>• View pacing analysis and suggestions</li>
                <li>• See real-time impact of changes</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Templates Tab</h3>
              <ul className="space-y-1">
                <li>• Browse different character arc patterns</li>
                <li>• Preview templates with detailed breakdowns</li>
                <li>• Filter by category and difficulty level</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                Relationships Tab
              </h3>
              <ul className="space-y-1">
                <li>• Explore interactive network visualization</li>
                <li>• Filter relationships by type</li>
                <li>• Click nodes to see character details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
