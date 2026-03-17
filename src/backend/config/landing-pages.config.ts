export interface LandingPageConfig {
  eventCode: string;
  screenName: string;
  title?: string;
  requiredElements?: string[];
  urlDeepLink?: string;
}

/** Maps event codes to expected landing page configurations. */
export const LANDING_PAGES: Record<string, LandingPageConfig> = {
  PROMO_OFFER: {
    eventCode: 'PROMO_OFFER',
    screenName: 'PromotionsScreen',
    title: 'Special Offer',
    requiredElements: ['promo_title', 'promo_cta_button'],
  },
  ORDER_UPDATE: {
    eventCode: 'ORDER_UPDATE',
    screenName: 'OrderDetailsScreen',
    title: 'Order Details',
    requiredElements: ['order_id_label', 'order_status'],
  },
  ACCOUNT_ALERT: {
    eventCode: 'ACCOUNT_ALERT',
    screenName: 'AccountScreen',
    title: 'Account',
    requiredElements: ['account_balance', 'account_name'],
  },
  CHAT_MESSAGE: {
    eventCode: 'CHAT_MESSAGE',
    screenName: 'ChatScreen',
    title: 'Messages',
    requiredElements: ['message_input', 'send_button'],
  },
  NEWS_ARTICLE: {
    eventCode: 'NEWS_ARTICLE',
    screenName: 'ArticleScreen',
    title: 'News',
    requiredElements: ['article_title', 'article_body'],
  },
};

/**
 * Returns the landing page config for a given event code.
 * @param eventCode - Notification event code
 */
export function getLandingPageConfig(eventCode: string): LandingPageConfig | null {
  return LANDING_PAGES[eventCode] ?? null;
}
