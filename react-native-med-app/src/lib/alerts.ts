import { Alert, Platform } from 'react-native'

/**
 * Cross-platform alert utility
 */
export const showAlert = (title: string, message?: string) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}${message ? `\n\n${message}` : ''}`)
    } else {
        Alert.alert(title, message)
    }
}

/**
 * Cross-platform confirmation dialog utility
 */
export const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirmer',
    cancelText: string = 'Annuler',
    style: 'default' | 'destructive' = 'default'
) => {
    if (Platform.OS === 'web') {
        const result = window.confirm(`${title}\n\n${message}`)
        if (result) {
            onConfirm()
        }
    } else {
        Alert.alert(title, message, [
            { text: cancelText, style: 'cancel' },
            {
                text: confirmText,
                style: style === 'destructive' ? 'destructive' : 'default',
                onPress: onConfirm
            },
        ])
    }
}
