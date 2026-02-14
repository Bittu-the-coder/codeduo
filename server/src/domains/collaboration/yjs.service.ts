import * as Y from 'yjs';
import { cache, getRedisClient } from '../../config/redis.js';
import { logger } from '../../shared/utils/logger.js';
import { projectRepository } from '../projects/project.repository.js';

const YJS_DOC_PREFIX = 'yjs:doc:';
const YJS_TTL = 30 * 60; // 30 minutes

class YjsService {
  private docs: Map<string, Y.Doc> = new Map();

  /**
   * Get or create a Yjs document for a room
   */
  async getDocument(roomId: string, projectId: string): Promise<Y.Doc> {
    // Check in-memory cache first
    if (this.docs.has(roomId)) {
      return this.docs.get(roomId)!;
    }

    const doc = new Y.Doc();

    // Try to restore from Redis
    const savedState = await this.loadFromRedis(roomId);
    if (savedState) {
      Y.applyUpdate(doc, savedState);
      logger.info(`Restored Yjs doc for room ${roomId} from Redis`);
    } else {
      // Initialize from database
      await this.initializeFromProject(doc, projectId);
      logger.info(`Initialized Yjs doc for room ${roomId} from database`);
    }

    // Set up auto-save
    doc.on('update', async (update: Uint8Array) => {
      await this.saveToRedis(roomId, Y.encodeStateAsUpdate(doc));
    });

    this.docs.set(roomId, doc);
    return doc;
  }

  /**
   * Apply a Yjs update to a document
   */
  applyUpdate(roomId: string, update: Uint8Array): void {
    const doc = this.docs.get(roomId);
    if (doc) {
      Y.applyUpdate(doc, update);
    }
  }

  /**
   * Get the current state vector for syncing
   */
  getStateVector(roomId: string): Uint8Array | null {
    const doc = this.docs.get(roomId);
    return doc ? Y.encodeStateVector(doc) : null;
  }

  /**
   * Get updates since a given state vector
   */
  getUpdatesSince(roomId: string, stateVector: Uint8Array): Uint8Array | null {
    const doc = this.docs.get(roomId);
    return doc ? Y.encodeStateAsUpdate(doc, stateVector) : null;
  }

  /**
   * Get full state as update
   */
  getFullState(roomId: string): Uint8Array | null {
    const doc = this.docs.get(roomId);
    return doc ? Y.encodeStateAsUpdate(doc) : null;
  }

  /**
   * Persist document to database and cleanup
   */
  async persistAndCleanup(roomId: string, projectId: string): Promise<void> {
    const doc = this.docs.get(roomId);
    if (!doc) return;

    try {
      // Convert Yjs content to file tree
      const filesMap = doc.getMap<Y.Text>('files');
      const fileContents: Record<string, string> = {};

      filesMap.forEach((ytext, path) => {
        fileContents[path] = ytext.toString();
      });

      // Update project file contents in database
      const project = await projectRepository.findById(projectId);
      if (project) {
        const updateFileContents = (files: any[]): any[] => {
          return files.map(file => {
            if (file.type === 'file' && fileContents[file.path] !== undefined) {
              return { ...file, content: fileContents[file.path] };
            }
            if (file.type === 'folder' && file.children) {
              return { ...file, children: updateFileContents(file.children) };
            }
            return file;
          });
        };

        const updatedTree = updateFileContents(project.fileTree);
        await projectRepository.updateFileTree(projectId, updatedTree);
        logger.info(`Persisted Yjs doc for room ${roomId} to database`);
      }
    } catch (error) {
      logger.error(`Failed to persist Yjs doc for room ${roomId}:`, error);
    }

    // Cleanup
    doc.destroy();
    this.docs.delete(roomId);
    await cache.del(`${YJS_DOC_PREFIX}${roomId}`);
  }

  /**
   * Check if a document exists in memory
   */
  hasDocument(roomId: string): boolean {
    return this.docs.has(roomId);
  }

  // ── Private Helpers ──

  private async loadFromRedis(roomId: string): Promise<Uint8Array | null> {
    try {
      const redis = getRedisClient();
      if (!redis) return null;
      const data = await redis.getBuffer(`${YJS_DOC_PREFIX}${roomId}`);
      return data ? new Uint8Array(data) : null;
    } catch {
      return null;
    }
  }

  private async saveToRedis(roomId: string, state: Uint8Array): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) return;
      await redis.setex(
        `${YJS_DOC_PREFIX}${roomId}`,
        YJS_TTL,
        Buffer.from(state)
      );
    } catch (error) {
      logger.error(`Failed to save Yjs state to Redis:`, error);
    }
  }

  private async initializeFromProject(
    doc: Y.Doc,
    projectId: string
  ): Promise<void> {
    const project = await projectRepository.findById(projectId);
    if (!project) return;

    const filesMap = doc.getMap<Y.Text>('files');
    const projectMeta = doc.getMap('project-meta');

    // Flatten file tree and add to Yjs
    const addFilesToYjs = (files: any[]) => {
      for (const file of files) {
        if (file.type === 'file') {
          const ytext = new Y.Text();
          ytext.insert(0, file.content || '');
          filesMap.set(file.path, ytext);
        }
        if (file.type === 'folder' && file.children) {
          addFilesToYjs(file.children);
        }
      }
    };

    addFilesToYjs(project.fileTree);

    // Store file list metadata
    projectMeta.set('file-list', project.fileTree);
    projectMeta.set('project-id', projectId);
  }
}

export const yjsService = new YjsService();
