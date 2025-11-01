import { useCallback } from 'react';
import { useNotification } from './useNotification';
import { useLanguage } from './useLanguage';

// Mock function to simulate email sending - replace with actual API call
const mockSendEmail = async (recipientEmail, subject, message) => {
    // Simulated delay to mimic API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate success/failure
    if (Math.random() > 0.1) { // 90% success rate for testing
        return { success: true };
    }
    throw new Error('Failed to send email');
};

export function useOrganizerNotifications() {
    const { showNotification } = useNotification();
    const { translate } = useLanguage();

    const notifyOrganizer = useCallback(async ({
        organizerEmail,
        organizerName,
        eventTitle,
        status,
        feedback = ''
    }) => {
        try {
            const subject = translate(
                status === 'approved'
                    ? 'eventApprovalSubject'
                    : 'eventRejectionSubject'
            );

            const message = translate(
                status === 'approved'
                    ? 'eventApprovalMessage'
                    : 'eventRejectionMessage',
                {
                    organizerName,
                    eventTitle,
                    feedback: feedback || translate('noAdditionalFeedback')
                }
            );

            await mockSendEmail(organizerEmail, subject, message);

            showNotification(
                'success',
                translate('notificationSentSuccessfully')
            );

            return true;
        } catch (error) {
            showNotification(
                'error',
                translate('errorSendingNotification')
            );
            return false;
        }
    }, [showNotification, translate]);

    return {
        notifyOrganizer
    };
}