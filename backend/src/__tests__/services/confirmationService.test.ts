import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import confirmationService, { ConfirmationType, FeedbackMode } from '../../services/confirmationService';

describe('ConfirmationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('determineConfirmationType', () => {
    it('should require explicit confirmation for low confidence', () => {
      const request = {
        confidence: 0.45,
        action: 'add' as const,
        item: 'milk',
        quantity: 5,
        unit: 'gallons'
      };
      
      const result = confirmationService.determineConfirmationType(request);
      
      expect(result.type).toBe(ConfirmationType.EXPLICIT);
      expect(result.riskLevel).toBe('high');
      expect(result.feedbackMode).toBe(FeedbackMode.DETAILED);
    });
    
    it('should require visual confirmation for medium confidence', () => {
      const request = {
        confidence: 0.65,
        action: 'add' as const,
        item: 'milk',
        quantity: 5,
        unit: 'gallons'
      };
      
      const result = confirmationService.determineConfirmationType(request);
      
      expect(result.type).toBe(ConfirmationType.VISUAL);
      expect(result.riskLevel).toBe('medium');
      expect(result.feedbackMode).toBe(FeedbackMode.BRIEF);
      expect(result.timeoutSeconds).toBeDefined();
    });
    
    it('should accept implicit confirmation for high confidence', () => {
      const request = {
        confidence: 0.95,
        action: 'add' as const,
        item: 'milk',
        quantity: 5,
        unit: 'gallons'
      };
      
      const result = confirmationService.determineConfirmationType(request);
      
      expect(result.type).toBe(ConfirmationType.IMPLICIT);
      expect(result.riskLevel).toBe('low');
    });
    
    it('should require confirmation for similar items', () => {
      const request = {
        confidence: 0.95,
        action: 'add' as const,
        item: 'milk',
        quantity: 5,
        unit: 'gallons',
        similarItems: ['whole milk', 'almond milk']
      };
      
      const calculateSimilaritySpy = jest.spyOn(confirmationService as any, 'calculateSimilarity').mockReturnValue(0.8);
      
      const result = confirmationService.determineConfirmationType(request);
      
      expect(result.type).toBe(ConfirmationType.VOICE);
      expect(result.suggestedCorrection).toBeDefined();
      
      calculateSimilaritySpy.mockRestore();
    });
    
    it('should require explicit confirmation for large quantity changes', () => {
      const request = {
        confidence: 0.95,
        action: 'remove' as const,
        item: 'milk',
        quantity: 50,
        unit: 'gallons',
        currentQuantity: 60
      };
      
      const result = confirmationService.determineConfirmationType(request);
      
      expect(result.type).toBe(ConfirmationType.EXPLICIT);
      expect(result.riskLevel).toBe('high');
    });
    
    it('should adapt confirmation based on user role', () => {
      const request = {
        confidence: 0.95,
        action: 'add' as const,
        item: 'milk',
        quantity: 5,
        unit: 'gallons',
        userRole: 'readonly'
      };
      
      const result = confirmationService.determineConfirmationType(request);
      
      expect(result.type).toBe(ConfirmationType.EXPLICIT);
      expect(result.reason).toContain('Read-only users');
    });
    
    it('should consider user history for personalized confirmation', () => {
      const request = {
        confidence: 0.95,
        action: 'add' as const,
        item: 'milk',
        quantity: 5,
        unit: 'gallons',
        previousConfirmations: {
          correct: 3,
          total: 10,
          recentMistakes: ['quantity']
        }
      };
      
      const result = confirmationService.determineConfirmationType(request);
      
      expect(result.type).toBe(ConfirmationType.VISUAL);
      expect(result.suggestedCorrection).toContain('quantity');
    });
    
    it('should consider session context for progressive disclosure', () => {
      const request = {
        confidence: 0.75,
        action: 'add' as const,
        item: 'milk',
        quantity: 5,
        unit: 'gallons',
        sessionItems: ['milk', 'eggs', 'bread']
      };
      
      const result = confirmationService.determineConfirmationType(request);
      
      expect(result.type).toBe(ConfirmationType.IMPLICIT);
    });
    
    it('should always require voice confirmation for removals', () => {
      const request = {
        confidence: 0.95,
        action: 'remove' as const,
        item: 'milk',
        quantity: 1,
        unit: 'gallons',
        currentQuantity: 10
      };
      
      const result = confirmationService.determineConfirmationType(request);
      
      expect(result.type).toBe(ConfirmationType.VOICE);
    });
  });
  
  describe('calculateSimilarity', () => {
    it('should calculate high similarity for similar strings', () => {
      const result = (confirmationService as any).calculateSimilarity('whole milk', 'whole milk 2%');
      
      expect(result).toBeGreaterThan(0.7);
    });
    
    it('should calculate low similarity for different strings', () => {
      const result = (confirmationService as any).calculateSimilarity('coffee beans', 'milk');
      
      expect(result).toBeLessThan(0.5);
    });
    
    it('should handle empty strings', () => {
      const result = (confirmationService as any).calculateSimilarity('', '');
      
      expect(result).toBe(1);
    });
  });
  
  describe('isLargeQuantityChange', () => {
    it('should identify large additions', () => {
      const result = (confirmationService as any).isLargeQuantityChange('add', 60, 100);
      
      expect(result).toBe(true);
    });
    
    it('should identify small additions', () => {
      const result = (confirmationService as any).isLargeQuantityChange('add', 10, 100);
      
      expect(result).toBe(false);
    });
    
    it('should identify large removals', () => {
      const result = (confirmationService as any).isLargeQuantityChange('remove', 40, 100);
      
      expect(result).toBe(true);
    });
    
    it('should handle undefined current quantity', () => {
      const result = (confirmationService as any).isLargeQuantityChange('add', 150);
      
      expect(result).toBe(true);
    });
  });
  
  describe('processVoiceCorrection', () => {
    it('should process simple confirmation', () => {
      const originalCommand = {
        action: 'add',
        item: 'milk',
        quantity: 5,
        unit: 'gallons'
      };
      
      const result = confirmationService.processVoiceCorrection(originalCommand, 'yes');
      
      expect(result).toEqual({
        ...originalCommand,
        mistakeType: 'multiple'
      });
    });
    
    it('should process quantity correction', () => {
      const originalCommand = {
        action: 'add',
        item: 'milk',
        quantity: 5,
        unit: 'gallons'
      };
      
      const result = confirmationService.processVoiceCorrection(originalCommand, 'No, it should be 10');
      
      expect(result).toEqual({
        ...originalCommand,
        quantity: 10,
        mistakeType: 'quantity'
      });
    });
    
    it('should handle word number corrections', () => {
      const originalCommand = {
        action: 'add',
        item: 'milk',
        quantity: 5,
        unit: 'gallons'
      };
      
      const result = confirmationService.processVoiceCorrection(originalCommand, 'I meant three');
      
      expect(result).toEqual({
        ...originalCommand,
        quantity: 3,
        mistakeType: 'quantity'
      });
    });
    
    it('should return null for simple rejection', () => {
      const originalCommand = {
        action: 'add',
        item: 'milk',
        quantity: 5,
        unit: 'gallons'
      };
      
      const result = confirmationService.processVoiceCorrection(originalCommand, 'No');
      
      expect(result).toBeNull();
    });
  });
});
