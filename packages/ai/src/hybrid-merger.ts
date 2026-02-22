import type { ClassificationResult, AIResponse, CrashAnalysis } from '@crashsense/types';

function generateHeuristicExplanation(classification: ClassificationResult): string {
  const { category, subcategory, confidence } = classification;
  return `Heuristic analysis identified this as a ${category} issue (${subcategory}) ` +
    `with ${(confidence * 100).toFixed(0)}% confidence. ` +
    classification.contributingFactors
      .map((f) => f.evidence)
      .join(' ');
}

export function mergeAnalysis(
  heuristic: ClassificationResult,
  aiResponse: AIResponse | null,
): CrashAnalysis {
  if (!aiResponse) {
    return {
      rootCause: `${heuristic.category}: ${heuristic.subcategory}`,
      explanation: generateHeuristicExplanation(heuristic),
      fix: null,
      prevention: [],
      confidence: heuristic.confidence,
      alternativeCauses: [],
      source: 'heuristic',
    };
  }

  if (aiResponse.confidence > 0.8) {
    return {
      rootCause: aiResponse.rootCause,
      explanation: aiResponse.explanation,
      fix: aiResponse.fix,
      prevention: aiResponse.prevention,
      confidence: heuristic.confidence * 0.4 + aiResponse.confidence * 0.6,
      alternativeCauses: aiResponse.alternativeCauses,
      source: 'ai',
    };
  }

  return {
    rootCause: aiResponse.rootCause || `${heuristic.category}: ${heuristic.subcategory}`,
    explanation: aiResponse.explanation || generateHeuristicExplanation(heuristic),
    fix: aiResponse.fix,
    prevention: aiResponse.prevention,
    confidence: heuristic.confidence * 0.4 + aiResponse.confidence * 0.6,
    alternativeCauses: aiResponse.alternativeCauses,
    source: 'hybrid',
  };
}
