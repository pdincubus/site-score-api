import { describe, expect, it } from 'vitest';
import { assertDestructiveSeedAllowed } from './run-seed.js';

describe('assertDestructiveSeedAllowed', () => {
    it('allows local development seeds without an override URL', () => {
        expect(() => assertDestructiveSeedAllowed({
            nodeEnv: 'development',
            connectionString: 'postgresql://localhost:5432/site_score_api',
            seedDatabaseUrl: '',
            allowDestructiveSeed: false
        })).not.toThrow();
    });

    it('blocks production seeds without explicit approval', () => {
        expect(() => assertDestructiveSeedAllowed({
            nodeEnv: 'production',
            connectionString: 'postgresql://localhost:5432/site_score_api',
            seedDatabaseUrl: '',
            allowDestructiveSeed: false
        })).toThrow('Destructive seed blocked');
    });

    it('blocks development seeds when DATABASE_URL points at a remote database', () => {
        expect(() => assertDestructiveSeedAllowed({
            nodeEnv: 'development',
            connectionString: 'postgresql://db.example.com/site_score_api',
            seedDatabaseUrl: '',
            allowDestructiveSeed: false
        })).toThrow('Destructive seed blocked');
    });

    it('blocks override database seeds without explicit approval', () => {
        expect(() => assertDestructiveSeedAllowed({
            nodeEnv: 'development',
            connectionString: 'postgresql://example.com/site_score_api',
            seedDatabaseUrl: 'postgresql://example.com/site_score_api',
            allowDestructiveSeed: false
        })).toThrow('Destructive seed blocked');
    });

    it('allows destructive seeds with explicit approval', () => {
        expect(() => assertDestructiveSeedAllowed({
            nodeEnv: 'production',
            connectionString: 'postgresql://example.com/site_score_api',
            seedDatabaseUrl: 'postgresql://example.com/site_score_api',
            allowDestructiveSeed: true
        })).not.toThrow();
    });
});
