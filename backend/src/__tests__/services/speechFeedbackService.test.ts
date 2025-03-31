import speechFeedbackService from '../../services/speechFeedbackService';
import { FeedbackMode } from '../../services/confirmationService';

describe('SpeechFeedbackService', () => {
  beforeEach(() => {
    // Reset the service state before each test
    speechFeedbackService.setEnabled(true);
  });

  describe('generateSuccessFeedback', () => {
    test('should return null when feedback is disabled', () => {
      speechFeedbackService.setEnabled(false);
      const result = speechFeedbackService.generateSuccessFeedback('add', 5, 'kg', 'apples');
      expect(result).toBeNull();
    });

    test('should generate brief success message for add action', () => {
      const result = speechFeedbackService.generateSuccessFeedback('add', 5, 'kg', 'apples');
      expect(result).toEqual({
        text: 'Logged: added 5 kg of apples',
        type: 'success'
      });
    });

    test('should generate brief success message for remove action', () => {
      const result = speechFeedbackService.generateSuccessFeedback('remove', 2, 'l', 'milk');
      expect(result).toEqual({
        text: 'Logged: removed 2 l of milk',
        type: 'success'
      });
    });

    test('should generate brief success message for set action', () => {
      const result = speechFeedbackService.generateSuccessFeedback('set', 10, 'pcs', 'eggs');
      expect(result).toEqual({
        text: 'Logged: set 10 pcs of eggs',
        type: 'success'
      });
    });
  });
}); 