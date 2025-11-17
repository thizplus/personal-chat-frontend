// src/utils/dateUtils.ts
export const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
        return 'เมื่อสักครู่';
    } else if (diffMins < 60) {
        return `${diffMins} นาทีที่แล้ว`;
    } else if (diffHours < 24) {
        return `${diffHours} ชั่วโมงที่แล้ว`;
    } else if (diffDays < 7) {
        return `${diffDays} วันที่แล้ว`;
    } else {
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short'
        });
    }
};