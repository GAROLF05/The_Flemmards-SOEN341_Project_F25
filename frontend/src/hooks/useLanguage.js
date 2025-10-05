import { useTranslation } from 'react-i18next';

/**
 * A custom hook to manage application language.
 * @returns {{
 * currentLanguage: string,
 * availableLanguages: string[]
 * translate: (text: string) => void
 * changeLanguage: (lang: string) => void,
 * }}
 */
export function useLanguage() {
    const { t, i18n } = useTranslation();

    const currentLanguage = i18n.language.split('-')[0];

    const translate = (text) => {
        return t(text);
    };

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
    };

    const availableLanguages = [
        "en",
        "fr",
    ]

    return {
        currentLanguage: currentLanguage,
        availableLanguages: availableLanguages,
        translate: translate,
        changeLanguage
    };
}
