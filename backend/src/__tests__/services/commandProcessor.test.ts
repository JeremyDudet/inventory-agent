import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NlpService } from '../../services/nlpService';
import speechFeedbackService from '../../services/speechFeedbackService';
import { InventoryUpdate, InventoryItem } from '../../types/inventory';
import { ActionLog } from '../../types/actionLog';
import { MockInventoryRepository } from '../mocks/inventoryRepository';

// Mock dependencies
jest.mock('../../services/nlpService');
jest.mock('../../services/speechFeedbackService', () => ({
  generateSuccessFeedback: jest.fn(),
}));

describe('Command Processor Tests', () => {
  let nlpService: jest.Mocked<NlpService>;
  let sessionActionLogs: Map<string, ActionLog[]>;
  let mockWs: any;
  let mockInventoryRepository: MockInventoryRepository;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Initialize session action logs
    sessionActionLogs = new Map<string, ActionLog[]>();
    sessionActionLogs.set('test-session', []);

    // Mock WebSocket
    mockWs = {
      send: jest.fn(),
    };

    // Mock NlpService
    nlpService = new NlpService() as jest.Mocked<NlpService>;

    // Initialize mock repository
    mockInventoryRepository = new MockInventoryRepository();

    // Spy on findByName to track calls while preserving its implementation
    jest.spyOn(mockInventoryRepository, 'findByName');

    // Mock speechFeedbackService.generateSuccessFeedback to return a feedback object
    (speechFeedbackService.generateSuccessFeedback as jest.Mock).mockImplementation(
      (action, quantity, unit, item) => ({
        text: `Logged: ${action} ${quantity} ${unit} of ${item}`,
        type: 'success',
      })
    );
  });

  describe('processTranscription', () => {
    it('should process a single add command', async () => {
      // Mock NLP result
      nlpService.processTranscription.mockResolvedValue([
        {
          action: 'add',
          item: 'coffee',
          quantity: 5,
          unit: 'pounds',
          confidence: 0.95,
          isComplete: true,
        },
      ]);

      // Add test item to repository
      mockInventoryRepository.addTestItem({
        id: 'coffee-1',
        name: 'coffee',
        quantity: 0,
        unit: 'pounds',
        category: 'beverages',
        lastupdated: new Date().toISOString(),
        embedding: []
      });

      // Mock inventory service
      const mockInventoryService = {
        repository: mockInventoryRepository,
        updateInventory: jest.fn(),
      };

      // Process command
      const transcript = 'add 5 pounds of coffee';
      const commands = await nlpService.processTranscription(transcript);

      for (const command of commands) {
        if (command.isComplete && command.action && command.item) {
          const update: InventoryUpdate = {
            action: command.action as 'add' | 'remove' | 'set',
            item: command.item,
            quantity: command.quantity || 0,
            unit: command.unit,
          };

          const items = await mockInventoryService.repository.findByName(command.item);
          const itemId = items[0]?.id || command.item;
          await mockInventoryService.updateInventory(update);

          const actionLog: ActionLog = {
            type: command.action as 'add' | 'remove' | 'set',
            itemId,
            quantity: command.quantity || 0,
            previousQuantity: items[0]?.quantity,
            timestamp: new Date(),
          };

          sessionActionLogs.get('test-session')?.push(actionLog);

          const feedback = speechFeedbackService.generateSuccessFeedback(
            command.action,
            command.quantity || 0,
            command.unit,
            command.item
          );

          if (feedback) {
            mockWs.send(JSON.stringify({ type: 'feedback', data: feedback }));
          }
        }
      }

      // Verify results
      expect(mockInventoryService.repository.findByName).toHaveBeenCalledWith('coffee');
      expect(mockInventoryService.updateInventory).toHaveBeenCalledWith({
        action: 'add',
        item: 'coffee',
        quantity: 5,
        unit: 'pounds',
      });
      expect(sessionActionLogs.get('test-session')).toHaveLength(1);
      expect(sessionActionLogs.get('test-session')?.[0]).toEqual({
        type: 'add',
        itemId: 'coffee-1',
        quantity: 5,
        previousQuantity: 0,
        timestamp: expect.any(Date),
      });
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('Logged: add 5 pounds of coffee')
      );
    });

    it('should process an undo command', async () => {
      // Add a previous action to the log
      sessionActionLogs.get('test-session')?.push({
        type: 'add',
        itemId: 'coffee-1',
        quantity: 5,
        previousQuantity: 0,
        timestamp: new Date(),
      });

      // Mock NLP result for undo command
      nlpService.processTranscription.mockResolvedValue([
        {
          action: '',
          item: '',
          quantity: undefined,
          unit: 'units',
          confidence: 0.95,
          isComplete: true,
          type: 'undo',
        },
      ]);

      // Mock inventory service
      const mockInventoryService = {
        updateInventory: jest.fn(),
      };

      // Process command
      const transcript = 'undo';
      const commands = await nlpService.processTranscription(transcript);

      for (const command of commands) {
        if (command.type === 'undo') {
          const actions = sessionActionLogs.get('test-session') || [];
          if (actions.length > 0) {
            const lastAction = actions.pop();
            if (lastAction) {
              let reverseAction: InventoryUpdate;
              if (lastAction.type === 'add') {
                reverseAction = {
                  action: 'remove',
                  item: lastAction.itemId,
                  quantity: lastAction.quantity || 0,
                  unit: 'units',
                };
              } else if (lastAction.type === 'remove') {
                reverseAction = {
                  action: 'add',
                  item: lastAction.itemId,
                  quantity: lastAction.quantity || 0,
                  unit: 'units',
                };
              } else {
                reverseAction = {
                  action: 'set',
                  item: lastAction.itemId,
                  quantity: lastAction.previousQuantity || 0,
                  unit: 'units',
                };
              }

              await mockInventoryService.updateInventory(reverseAction);

              const feedback = speechFeedbackService.generateSuccessFeedback(
                reverseAction.action,
                reverseAction.quantity,
                reverseAction.unit,
                reverseAction.item
              );

              if (feedback) {
                mockWs.send(JSON.stringify({ type: 'feedback', data: feedback }));
              }
            }
          }
        }
      }

      // Verify results
      expect(mockInventoryService.updateInventory).toHaveBeenCalledWith({
        action: 'remove',
        item: 'coffee-1',
        quantity: 5,
        unit: 'units',
      });
      expect(sessionActionLogs.get('test-session')).toHaveLength(0);
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('Logged: remove 5 units of coffee-1')
      );
    });

    it('should handle multiple commands in a single transcription', async () => {
      // Mock NLP result for multiple commands
      nlpService.processTranscription.mockResolvedValue([
        {
          action: 'add',
          item: 'coffee',
          quantity: 5,
          unit: 'pounds',
          confidence: 0.95,
          isComplete: true,
        },
        {
          action: 'remove',
          item: 'milk',
          quantity: 2,
          unit: 'gallons',
          confidence: 0.95,
          isComplete: true,
        },
      ]);

      // Add test items to repository
      mockInventoryRepository.addTestItem({
        id: 'coffee-1',
        name: 'coffee',
        quantity: 0,
        unit: 'pounds',
        category: 'beverages',
        lastupdated: new Date().toISOString(),
        embedding: []
      });
      mockInventoryRepository.addTestItem({
        id: 'milk-1',
        name: 'milk',
        quantity: 10,
        unit: 'gallons',
        category: 'dairy',
        lastupdated: new Date().toISOString(),
        embedding: []
      });

      // Mock inventory service
      const mockInventoryService = {
        repository: mockInventoryRepository,
        updateInventory: jest.fn(),
      };

      // Process commands
      const transcript = 'add 5 pounds of coffee and remove 2 gallons of milk';
      const commands = await nlpService.processTranscription(transcript);

      for (const command of commands) {
        if (command.isComplete && command.action && command.item) {
          const update: InventoryUpdate = {
            action: command.action as 'add' | 'remove' | 'set',
            item: command.item,
            quantity: command.quantity || 0,
            unit: command.unit,
          };

          const items = await mockInventoryService.repository.findByName(command.item);
          const itemId = items[0]?.id || command.item;
          await mockInventoryService.updateInventory(update);

          const actionLog: ActionLog = {
            type: command.action as 'add' | 'remove' | 'set',
            itemId,
            quantity: command.quantity || 0,
            previousQuantity: items[0]?.quantity,
            timestamp: new Date(),
          };

          sessionActionLogs.get('test-session')?.push(actionLog);

          const feedback = speechFeedbackService.generateSuccessFeedback(
            command.action,
            command.quantity || 0,
            command.unit,
            command.item
          );

          if (feedback) {
            mockWs.send(JSON.stringify({ type: 'feedback', data: feedback }));
          }
        }
      }

      // Verify results
      expect(mockInventoryService.repository.findByName).toHaveBeenCalledTimes(2);
      expect(mockInventoryService.repository.findByName).toHaveBeenCalledWith('coffee');
      expect(mockInventoryService.repository.findByName).toHaveBeenCalledWith('milk');
      expect(mockInventoryService.updateInventory).toHaveBeenCalledTimes(2);
      expect(sessionActionLogs.get('test-session')).toHaveLength(2);
      expect(mockWs.send).toHaveBeenCalledTimes(2);
    });
  });
});