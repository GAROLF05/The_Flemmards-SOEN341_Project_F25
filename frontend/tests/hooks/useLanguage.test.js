import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useLanguage } from '../../src/hooks/useLanguage';

// Mock the 'react-i18next' module
const mockT = jest.fn((key, options) => (options ? `${key} ${JSON.stringify(options)}` : key));
const mockChangeLanguage = jest.fn();

const mockI18n = {
    language: 'en-US',
    changeLanguage: mockChangeLanguage,
};

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: mockI18n,
    }),
}));

describe('useLanguage', () => {
    beforeEach(() => {
        // Clear mock history before each test
        mockT.mockClear();
        mockChangeLanguage.mockClear();
        mockI18n.language = 'en-US'; // Reset language for each test
    });

    it('should return the current language and available languages', () => {
        const { result } = renderHook(() => useLanguage());

        expect(result.current.currentLanguage).toBe('en');
        expect(result.current.availableLanguages).toEqual(['en', 'fr']);
    });

    it('should call the translation function with the correct key and options', () => {
        const { result } = renderHook(() => useLanguage());

        result.current.translate('testKey');
        expect(mockT).toHaveBeenCalledWith('testKey', {});

        const options = { count: 2 };
        result.current.translate('testKeyWithOptions', options);
        expect(mockT).toHaveBeenCalledWith('testKeyWithOptions', options);
    });

    it('should call changeLanguage with the new language', () => {
        const { result } = renderHook(() => useLanguage());

        act(() => {
            result.current.changeLanguage('fr');
        });

        expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
    });

    it('should update currentLanguage when i18n.language changes', () => {
        const { result, rerender } = renderHook(() => useLanguage());

        expect(result.current.currentLanguage).toBe('en');

        // Simulate language change
        mockI18n.language = 'fr-FR';
        rerender();

        expect(result.current.currentLanguage).toBe('fr');
    });
});