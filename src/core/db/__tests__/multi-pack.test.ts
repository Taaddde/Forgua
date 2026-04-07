import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../database';
import { installPack, uninstallPack } from '../seeds';
import type { PackManifest } from '../../types/pack-spec';
import japaneseManifest from '../../../packs/japanese/manifest.json';
import englishManifest from '../../../packs/english/manifest.json';

const LONG_TIMEOUT = 30000;

describe('Multi-pack support', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  }, LONG_TIMEOUT);

  it('should install the Japanese pack and create cards', async () => {
    await installPack(japaneseManifest as PackManifest);

    const pack = await db.packs.get('japanese');
    expect(pack).toBeDefined();
    expect(pack!.id).toBe('japanese');
    expect(pack!.family).toBe('cjk-japanese');

    const cards = await db.cards.where('packId').equals('japanese').count();
    expect(cards).toBeGreaterThan(0);
  }, LONG_TIMEOUT);

  it('should install the English pack and create cards', async () => {
    await installPack(englishManifest as PackManifest);

    const pack = await db.packs.get('english');
    expect(pack).toBeDefined();
    expect(pack!.id).toBe('english');
    expect(pack!.family).toBe('latin');

    const cards = await db.cards.where('packId').equals('english').count();
    expect(cards).toBeGreaterThan(0);
  }, LONG_TIMEOUT);

  it('should install both packs independently', async () => {
    await installPack(japaneseManifest as PackManifest);
    await installPack(englishManifest as PackManifest);

    const packs = await db.packs.toArray();
    expect(packs).toHaveLength(2);

    const jpCards = await db.cards.where('packId').equals('japanese').count();
    const enCards = await db.cards.where('packId').equals('english').count();
    expect(jpCards).toBeGreaterThan(0);
    expect(enCards).toBeGreaterThan(0);
  }, LONG_TIMEOUT);

  it('should filter cards by active pack — no overlap', async () => {
    await installPack(japaneseManifest as PackManifest);
    await installPack(englishManifest as PackManifest);

    const jpCards = await db.cards.where('packId').equals('japanese').toArray();
    const enCards = await db.cards.where('packId').equals('english').toArray();

    // All Japanese cards have packId 'japanese'
    for (const card of jpCards) {
      expect(card.packId).toBe('japanese');
    }
    // All English cards have packId 'english'
    for (const card of enCards) {
      expect(card.packId).toBe('english');
    }
  }, LONG_TIMEOUT);

  it('should uninstall a pack without affecting the other', async () => {
    // Use English pack for both install and uninstall since it's much smaller
    // and fake-indexeddb is slow with large datasets
    await installPack(englishManifest as PackManifest);

    const enCardsBefore = await db.cards.where('packId').equals('english').count();
    expect(enCardsBefore).toBeGreaterThan(0);

    // Install Japanese, then uninstall it
    await installPack(japaneseManifest as PackManifest);
    const jpCardsBefore = await db.cards.where('packId').equals('japanese').count();
    expect(jpCardsBefore).toBeGreaterThan(0);

    await uninstallPack('english');

    // English pack and cards should be gone
    const enPack = await db.packs.get('english');
    expect(enPack).toBeUndefined();
    const enCards = await db.cards.where('packId').equals('english').count();
    expect(enCards).toBe(0);

    // Japanese pack should still be intact
    const jpPack = await db.packs.get('japanese');
    expect(jpPack).toBeDefined();
    const jpCardsAfter = await db.cards.where('packId').equals('japanese').count();
    expect(jpCardsAfter).toBe(jpCardsBefore);
  }, LONG_TIMEOUT);

  it('should create progress records for each pack', async () => {
    await installPack(japaneseManifest as PackManifest);
    await installPack(englishManifest as PackManifest);

    const jpProgress = await db.progress.where('packId').equals('japanese').count();
    const enProgress = await db.progress.where('packId').equals('english').count();
    expect(jpProgress).toBeGreaterThan(0);
    expect(enProgress).toBeGreaterThan(0);
  }, LONG_TIMEOUT);

  it('should be idempotent — reinstalling does not duplicate cards', async () => {
    await installPack(englishManifest as PackManifest);
    const countBefore = await db.cards.where('packId').equals('english').count();

    await installPack(englishManifest as PackManifest);
    const countAfter = await db.cards.where('packId').equals('english').count();

    expect(countAfter).toBe(countBefore);
  }, LONG_TIMEOUT);

  it('should create vocabulary and grammar cards for English pack', async () => {
    await installPack(englishManifest as PackManifest);

    const vocabCards = await db.cards
      .where('[packId+category]')
      .equals(['english', 'vocabulary'])
      .count();
    const grammarCards = await db.cards
      .where('[packId+category]')
      .equals(['english', 'grammar'])
      .count();

    expect(vocabCards).toBeGreaterThan(0);
    expect(grammarCards).toBeGreaterThan(0);
  }, LONG_TIMEOUT);

  it('should create cards for all Japanese levels including N2 and N1', async () => {
    await installPack(japaneseManifest as PackManifest);

    for (const level of ['n5', 'n4', 'n3', 'n2', 'n1']) {
      const count = await db.cards
        .where('[packId+level]')
        .equals(['japanese', level])
        .count();
      expect(count).toBeGreaterThan(0);
    }
  }, LONG_TIMEOUT);
});
