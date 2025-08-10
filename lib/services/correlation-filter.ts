import { CorrelationData } from '../database/types'

interface CorrelationFilterRequest {
  correlations: CorrelationData[]
  userId: string
}

interface CorrelationFilterResponse {
  filteredCorrelations: CorrelationData[]
  removedCorrelations: CorrelationData[]
  reasoning: string
}

export class CorrelationFilterService {
  /**
   * Filter correlations to remove illogical ones using LLM analysis
   */
  static async filterIllogicalCorrelations(request: CorrelationFilterRequest): Promise<CorrelationFilterResponse> {
    try {
      console.log('🧠 Filtering correlations for logical consistency...')
      
      const { correlations, userId } = request
      
      if (!correlations || correlations.length === 0) {
        return {
          filteredCorrelations: [],
          removedCorrelations: [],
          reasoning: 'No correlations to filter'
        }
      }

      console.log('📊 Input correlations:', correlations.map(c => 
        `${c.metric1} ↔ ${c.metric2}: ${(c.correlation * 100).toFixed(1)}%`
      ))

      // For now, use fallback filter to ensure it works
      // TODO: Enable LLM filtering once API is stable
      console.log('🔄 Using fallback filter (LLM disabled for now)')
      return this.fallbackFilter(correlations)
      
      /* LLM filtering temporarily disabled
      // Prepare correlation data for LLM analysis
      const correlationData = correlations.map(corr => ({
        metric1: corr.metric1 || corr.metric_1 || 'Unknown',
        metric2: corr.metric2 || corr.metric_2 || 'Unknown',
        correlation: corr.correlation || 0,
        strength: Math.abs(corr.correlation || 0),
        direction: (corr.correlation || 0) > 0 ? 'positive' : 'negative',
        dataPoints: corr.data_points || 0
      }))

      // Create prompt for LLM analysis
      const prompt = this.createFilterPrompt(correlationData)
      
      // Call LLM API
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          userId: userId,
          context: 'correlation_filtering'
        })
      })

      if (!response.ok) {
        console.error('❌ LLM API error during correlation filtering:', response.status)
        return this.fallbackFilter(correlations)
      }

      const result = await response.json()
      console.log('🧠 LLM Response for correlation filtering:', result.content || result.message || '')
      
      // Parse LLM response
      return this.parseFilterResponse(result.content || result.message || '', correlations)
      */
      
    } catch (error) {
      console.error('Error filtering correlations:', error)
      return this.fallbackFilter(correlations)
    }
  }

  /**
   * Create prompt for LLM correlation filtering
   */
  private static createFilterPrompt(correlations: any[]): string {
    return `You are a health analytics expert. Analyze the following health metric correlations and identify which ones are LOGICALLY CONSISTENT with medical knowledge.

HEALTH CORRELATIONS TO ANALYZE:
${correlations.map((corr, index) => `
${index + 1}. ${corr.metric1} ↔ ${corr.metric2}
   - Correlation: ${(corr.correlation * 100).toFixed(1)}% (${corr.direction})
   - Strength: ${(corr.strength * 100).toFixed(1)}%
   - Data Points: ${corr.dataPoints}
`).join('')}

MEDICAL LOGIC RULES:
- Sleep improvement should generally correlate POSITIVELY with mood improvement
- Exercise improvement should generally correlate POSITIVELY with mood improvement  
- Exercise improvement should generally correlate NEGATIVELY with stress levels
- Sleep improvement should generally correlate NEGATIVELY with stress levels
- Glucose control improvement should correlate POSITIVELY with overall health
- Medication adherence should correlate POSITIVELY with health outcomes
- Weight loss should correlate POSITIVELY with exercise (if exercise increases, weight should decrease)

ILLOGICAL PATTERNS TO FILTER OUT:
- Sleep improvement leading to mood DECLINE (should be positive)
- Exercise improvement leading to mood DECLINE (should be positive)
- Sleep improvement leading to stress INCREASE (should be negative)
- Exercise improvement leading to stress INCREASE (should be negative)
- Any correlation that contradicts established medical knowledge

TASK:
1. Analyze each correlation for logical consistency
2. Identify correlations that contradict medical knowledge
3. Return a JSON response with:
   - "logical_correlations": array of indices (1-based) that are logically sound
   - "illogical_correlations": array of indices (1-based) that should be filtered out
   - "reasoning": brief explanation of why illogical correlations were removed

RESPONSE FORMAT (JSON):
{
  "logical_correlations": [1, 3, 4],
  "illogical_correlations": [2, 5],
  "reasoning": "Filtered out correlations where sleep improvement led to mood decline, as this contradicts established medical knowledge that better sleep typically improves mood."
}

Be strict about medical logic. When in doubt, filter out the correlation.`
  }

  /**
   * Parse LLM filter response
   */
  private static parseFilterResponse(response: string, originalCorrelations: CorrelationData[]): CorrelationFilterResponse {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        const logicalIndices = parsed.logical_correlations || []
        const illogicalIndices = parsed.illogical_correlations || []
        
        // Convert 1-based indices to 0-based and filter correlations
        const filteredCorrelations: CorrelationData[] = []
        const removedCorrelations: CorrelationData[] = []
        
        originalCorrelations.forEach((corr, index) => {
          const oneBasedIndex = index + 1
          if (logicalIndices.includes(oneBasedIndex)) {
            filteredCorrelations.push(corr)
          } else if (illogicalIndices.includes(oneBasedIndex)) {
            removedCorrelations.push(corr)
          } else {
            // If not explicitly marked, keep it (conservative approach)
            filteredCorrelations.push(corr)
          }
        })
        
        return {
          filteredCorrelations,
          removedCorrelations,
          reasoning: parsed.reasoning || 'Filtered based on medical logic'
        }
      }
      
      // Fallback if JSON parsing fails
      return this.fallbackFilter(originalCorrelations)
      
    } catch (error) {
      console.error('Error parsing LLM filter response:', error)
      return this.fallbackFilter(originalCorrelations)
    }
  }

  /**
   * Fallback filter using basic rules
   */
  private static fallbackFilter(correlations: CorrelationData[]): CorrelationFilterResponse {
    const filteredCorrelations: CorrelationData[] = []
    const removedCorrelations: CorrelationData[] = []
    
    correlations.forEach(corr => {
      const metric1 = (corr.metric1 || corr.metric_1 || '').toLowerCase()
      const metric2 = (corr.metric2 || corr.metric_2 || '').toLowerCase()
      const correlation = corr.correlation || 0
      
      // Basic illogical pattern detection
      const isIllogical = this.isIllogicalCorrelation(metric1, metric2, correlation)
      
      if (isIllogical) {
        removedCorrelations.push(corr)
      } else {
        filteredCorrelations.push(corr)
      }
    })
    
    return {
      filteredCorrelations,
      removedCorrelations,
      reasoning: 'Applied basic medical logic rules due to LLM unavailability'
    }
  }

  /**
   * Check if a correlation is illogical based on basic rules
   */
  private static isIllogicalCorrelation(metric1: string, metric2: string, correlation: number): boolean {
    const isSleep = metric1.includes('sleep') || metric2.includes('sleep')
    const isExercise = metric1.includes('exercise') || metric2.includes('exercise')
    const isMood = metric1.includes('mood') || metric2.includes('mood')
    const isStress = metric1.includes('stress') || metric2.includes('stress')
    
    console.log(`🔍 Checking correlation: ${metric1} ↔ ${metric2} = ${(correlation * 100).toFixed(1)}%`)
    console.log(`   Sleep: ${isSleep}, Exercise: ${isExercise}, Mood: ${isMood}, Stress: ${isStress}`)
    
    // Illogical patterns - be more aggressive with filtering
    if (isSleep && isMood && correlation < -0.2) {
      console.log(`   ❌ FILTERED: Sleep improvement leading to mood decline`)
      return true
    }
    
    if (isExercise && isMood && correlation < -0.2) {
      console.log(`   ❌ FILTERED: Exercise improvement leading to mood decline`)
      return true
    }
    
    if (isSleep && isStress && correlation > 0.2) {
      console.log(`   ❌ FILTERED: Sleep improvement leading to stress increase`)
      return true
    }
    
    if (isExercise && isStress && correlation > 0.2) {
      console.log(`   ❌ FILTERED: Exercise improvement leading to stress increase`)
      return true
    }
    
    console.log(`   ✅ KEPT: Correlation appears logical`)
    return false
  }
}
