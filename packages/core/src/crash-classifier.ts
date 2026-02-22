import type {
  RawCrashEvent,
  ClassificationResult,
  CrashCategory,
  ContributingFactor,
} from '@crashsense/types';

interface CategoryScore {
  category: CrashCategory;
  subcategory: string;
  confidence: number;
  factors: ContributingFactor[];
}

function evaluateRuntimeError(event: RawCrashEvent): CategoryScore {
  const type = event.error.type;
  const knownTypes = ['TypeError', 'ReferenceError', 'RangeError', 'SyntaxError', 'URIError', 'EvalError'];

  if (knownTypes.includes(type)) {
    return {
      category: 'runtime_error',
      subcategory: type.toLowerCase(),
      confidence: 0.95,
      factors: [{
        factor: 'known_error_type',
        weight: 0.95,
        evidence: `Error type: ${type}`,
      }],
    };
  }

  if (event.error.message) {
    return {
      category: 'runtime_error',
      subcategory: 'custom_error',
      confidence: 0.7,
      factors: [{
        factor: 'unhandled_error',
        weight: 0.7,
        evidence: `Custom error: ${event.error.message.slice(0, 100)}`,
      }],
    };
  }

  return {
    category: 'runtime_error',
    subcategory: 'unknown',
    confidence: 0.5,
    factors: [],
  };
}

function evaluateMemoryIssue(event: RawCrashEvent): CategoryScore {
  const mem = event.system.memory;
  if (!mem) return { category: 'memory_issue', subcategory: 'unknown', confidence: 0, factors: [] };

  const factors: ContributingFactor[] = [];
  let confidence = 0;

  if (mem.utilizationPercent !== undefined && mem.utilizationPercent !== null && mem.utilizationPercent > 85) {
    confidence += 0.35;
    factors.push({
      factor: 'high_memory_utilization',
      weight: 0.35,
      evidence: `Memory utilization: ${mem.utilizationPercent}%`,
    });
  }

  if (mem.trend === 'growing') {
    confidence += 0.25;
    factors.push({
      factor: 'growing_memory_trend',
      weight: 0.25,
      evidence: 'Memory usage is growing over time',
    });
  }

  if (mem.trend === 'spike') {
    confidence += 0.15;
    factors.push({
      factor: 'memory_spike',
      weight: 0.15,
      evidence: 'Memory usage spiked recently',
    });
  }

  const msg = event.error.message.toLowerCase();
  if (msg.includes('out of memory') || msg.includes('allocation failed') || msg.includes('arraybuffer')) {
    confidence += 0.25;
    factors.push({
      factor: 'memory_error_message',
      weight: 0.25,
      evidence: `Error message suggests memory issue: ${event.error.message.slice(0, 80)}`,
    });
  }

  const subcategory = mem.trend === 'growing' ? 'memory_leak'
    : mem.trend === 'spike' ? 'heap_spike'
    : (mem.utilizationPercent ?? 0) > 95 ? 'heap_overflow'
    : 'memory_pressure';

  return {
    category: 'memory_issue',
    subcategory,
    confidence: Math.min(confidence, 1),
    factors,
  };
}

function evaluateEventLoopBlocking(event: RawCrashEvent): CategoryScore {
  const cpu = event.system.cpu;
  if (!cpu) return { category: 'event_loop_blocking', subcategory: 'unknown', confidence: 0, factors: [] };

  const factors: ContributingFactor[] = [];
  let confidence = 0;

  if (cpu.maxLongTaskDuration > 1000) {
    confidence += 0.4;
    factors.push({
      factor: 'critical_blocking',
      weight: 0.4,
      evidence: `Max long task: ${Math.round(cpu.maxLongTaskDuration)}ms`,
    });
  } else if (cpu.maxLongTaskDuration > 200) {
    confidence += 0.2;
    factors.push({
      factor: 'long_task_detected',
      weight: 0.2,
      evidence: `Max long task: ${Math.round(cpu.maxLongTaskDuration)}ms`,
    });
  }

  if (cpu.longTasksLast30s > 10) {
    confidence += 0.3;
    factors.push({
      factor: 'frequent_long_tasks',
      weight: 0.3,
      evidence: `${cpu.longTasksLast30s} long tasks in last 30s`,
    });
  }

  if (cpu.estimatedBlockingTime > 5000) {
    confidence += 0.3;
    factors.push({
      factor: 'high_tbt',
      weight: 0.3,
      evidence: `Estimated blocking time: ${Math.round(cpu.estimatedBlockingTime)}ms`,
    });
  }

  const subcategory = cpu.maxLongTaskDuration > 5000 ? 'infinite_loop'
    : cpu.maxLongTaskDuration > 1000 ? 'critical_blocking'
    : cpu.longTasksLast30s > 10 ? 'frequent_blocking'
    : 'long_task';

  return {
    category: 'event_loop_blocking',
    subcategory,
    confidence: Math.min(confidence, 1),
    factors,
  };
}

function evaluateReactFramework(event: RawCrashEvent): CategoryScore {
  if (event.framework.name !== 'react') {
    return { category: 'framework_react', subcategory: 'unknown', confidence: 0, factors: [] };
  }

  const msg = event.error.message.toLowerCase();
  const factors: ContributingFactor[] = [];
  let confidence = 0;
  let subcategory = 'component_error';

  if (msg.includes('hydrat')) {
    confidence = 0.95;
    subcategory = 'hydration_mismatch';
    factors.push({
      factor: 'hydration_error',
      weight: 0.95,
      evidence: 'Error message indicates hydration mismatch',
    });
  } else if (msg.includes('maximum update depth') || msg.includes('too many re-renders')) {
    confidence = 0.95;
    subcategory = 'infinite_rerender';
    factors.push({
      factor: 'infinite_render_loop',
      weight: 0.95,
      evidence: 'React detected infinite re-render loop',
    });
  } else if (msg.includes('rendered fewer hooks') || msg.includes('rendered more hooks')) {
    confidence = 0.9;
    subcategory = 'hook_violation';
    factors.push({
      factor: 'hook_rule_violation',
      weight: 0.9,
      evidence: 'Hook ordering violation detected',
    });
  } else if (event.framework.lifecycleStage) {
    confidence = 0.85;
    subcategory = `lifecycle_error_${event.framework.lifecycleStage}`;
    factors.push({
      factor: 'react_lifecycle_error',
      weight: 0.85,
      evidence: `Error during React ${event.framework.lifecycleStage} phase`,
    });
  } else {
    confidence = 0.7;
    factors.push({
      factor: 'react_context',
      weight: 0.7,
      evidence: 'Error occurred in React application context',
    });
  }

  return {
    category: 'framework_react',
    subcategory,
    confidence,
    factors,
  };
}

function evaluateVueFramework(event: RawCrashEvent): CategoryScore {
  if (event.framework.name !== 'vue') {
    return { category: 'framework_vue', subcategory: 'unknown', confidence: 0, factors: [] };
  }

  const msg = event.error.message.toLowerCase();
  const factors: ContributingFactor[] = [];
  let confidence = 0;
  let subcategory = 'component_error';

  if (msg.includes('maximum recursive') || msg.includes('infinite') && msg.includes('computed')) {
    confidence = 0.95;
    subcategory = 'reactivity_loop';
    factors.push({
      factor: 'vue_reactivity_loop',
      weight: 0.95,
      evidence: 'Detected infinite reactivity loop',
    });
  } else if (event.framework.lifecycleStage) {
    confidence = 0.85;
    subcategory = `lifecycle_error_${event.framework.lifecycleStage}`;
    factors.push({
      factor: 'vue_lifecycle_error',
      weight: 0.85,
      evidence: `Error during Vue ${event.framework.lifecycleStage} phase`,
    });
  } else {
    confidence = 0.7;
    factors.push({
      factor: 'vue_context',
      weight: 0.7,
      evidence: 'Error occurred in Vue application context',
    });
  }

  return {
    category: 'framework_vue',
    subcategory,
    confidence,
    factors,
  };
}

function evaluateNetworkInduced(event: RawCrashEvent): CategoryScore {
  const network = event.system.network;
  if (!network) return { category: 'network_induced', subcategory: 'unknown', confidence: 0, factors: [] };

  const factors: ContributingFactor[] = [];
  let confidence = 0;

  if (network.failedRequestsLast60s !== undefined && network.failedRequestsLast60s > 0) {
    confidence += 0.3;
    factors.push({
      factor: 'recent_network_failures',
      weight: 0.3,
      evidence: `${network.failedRequestsLast60s} failed requests in last 60s`,
    });
  }

  if (network.isOnline === false) {
    confidence += 0.3;
    factors.push({
      factor: 'offline',
      weight: 0.3,
      evidence: 'Device is offline',
    });
  }

  const msg = event.error.message.toLowerCase();
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('cors') || msg.includes('xhr')) {
    confidence += 0.3;
    factors.push({
      factor: 'network_error_message',
      weight: 0.3,
      evidence: `Error message suggests network issue: ${event.error.message.slice(0, 80)}`,
    });
  }

  const subcategory = (network.isOnline === false) ? 'offline'
    : msg.includes('cors') ? 'cors_block'
    : msg.includes('timeout') ? 'timeout'
    : (network.failedRequestsLast60s ?? 0) > 0 ? 'failed_request'
    : 'network_error';

  return {
    category: 'network_induced',
    subcategory,
    confidence: Math.min(confidence, 1),
    factors,
  };
}

function evaluateIframeOverload(event: RawCrashEvent): CategoryScore {
  const iframe = event.system.iframe;
  if (!iframe) return { category: 'iframe_overload', subcategory: 'unknown', confidence: 0, factors: [] };

  const factors: ContributingFactor[] = [];
  let confidence = 0;

  if (iframe.totalCount > 10) {
    confidence += 0.3;
    factors.push({
      factor: 'excessive_iframes',
      weight: 0.3,
      evidence: `${iframe.totalCount} iframes active`,
    });
  } else if (iframe.totalCount > 5) {
    confidence += 0.15;
    factors.push({
      factor: 'many_iframes',
      weight: 0.15,
      evidence: `${iframe.totalCount} iframes active`,
    });
  }

  if (iframe.addedLast60s > 5) {
    confidence += 0.25;
    factors.push({
      factor: 'rapid_iframe_creation',
      weight: 0.25,
      evidence: `${iframe.addedLast60s} iframes added in last 60s`,
    });
  }

  if (iframe.crossOriginCount > 3) {
    confidence += 0.2;
    factors.push({
      factor: 'cross_origin_iframes',
      weight: 0.2,
      evidence: `${iframe.crossOriginCount} cross-origin iframes`,
    });
  }

  const mem = event.system.memory;
  if (mem && mem.trend === 'growing' && (mem.utilizationPercent ?? 0) > 70) {
    confidence += 0.25;
    factors.push({
      factor: 'iframe_memory_correlation',
      weight: 0.25,
      evidence: `Memory growing at ${mem.utilizationPercent}% with ${iframe.totalCount} iframes`,
    });
  }

  const subcategory = iframe.addedLast60s > 5 ? 'rapid_creation'
    : iframe.crossOriginCount > 3 ? 'cross_origin_overload'
    : iframe.totalCount > 10 ? 'excessive_count'
    : 'iframe_pressure';

  return {
    category: 'iframe_overload',
    subcategory,
    confidence: Math.min(confidence, 1),
    factors,
  };
}

export function classifyCrash(event: RawCrashEvent): ClassificationResult {
  const evaluators = [
    evaluateReactFramework,
    evaluateVueFramework,
    evaluateIframeOverload,
    evaluateMemoryIssue,
    evaluateEventLoopBlocking,
    evaluateNetworkInduced,
    evaluateRuntimeError,
  ];

  let best: CategoryScore = {
    category: 'runtime_error',
    subcategory: 'unknown',
    confidence: 0.1,
    factors: [],
  };

  const allFactors: ContributingFactor[] = [];

  for (const evaluate of evaluators) {
    const result = evaluate(event);
    if (result.confidence > 0.2) {
      allFactors.push(...result.factors);
    }
    if (result.confidence > best.confidence) {
      best = result;
    }
  }

  return {
    category: best.category,
    subcategory: best.subcategory,
    confidence: best.confidence,
    contributingFactors: allFactors,
  };
}
