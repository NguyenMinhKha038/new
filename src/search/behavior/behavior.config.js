// Types of user behavior
const Types = {
  // Shopping behaviors
  Shopping: {
    Buy_Online: 'buy_online',
    Buy_Offline: 'buy_offline',
    Cancel_Order: 'cancel_order'
  },

  // Reaction behaviors
  Reaction: {
    // product
    View_Product: 'view_product',
    Share_Product: 'share_product',
    Like_Product: 'like_product',
    Unlike_Product: 'unlike_product',
    Favorite_Product: 'favorite_product',
    Unfavorite_Product: 'unfavorite_product',

    // company
    View_Company: 'view_company',
    Like_Company: 'like_company',
    Unlike_Company: 'unlike_company',
    Rate_Company: 'rate_company',
    Unrate_Company: 'unrate_company',
    Follow_Company: 'follow_company',
    Unfollow_Company: 'unfollow_company',
    Share_Company: 'share_company',

    // comment
    Comment: 'comment'
  }
};

const PositiveBehaviors = {
  // Shopping behaviors
  Shopping: ['buy_online', 'buy_offline'],

  // Reaction behaviors
  Reaction: {
    // product
    Product: ['share_product', 'like_product', 'favorite_product'],

    // company
    Company: ['like_company', 'follow_company', 'share_company']
  }
};

const NegativeBehaviors = {
  // Shopping behaviors
  Shopping: ['cancel_order'],

  // Reaction behaviors
  Reaction: {
    // product
    Product: ['unlike_product', 'unfavorite_product'],

    // company
    Company: ['unlike_company', 'unfollow_company']
  }
};

const GeneralBehaviors = {
  // Shopping behaviors
  Shopping: [],

  // Reaction behaviors
  Reaction: {
    // product
    Product: ['view_product'],

    // company
    Company: ['view_company', 'rate_company', 'unrate_company'],

    // comment
    Comment: 'comment'
  }
};

// Default limit results per page
const DefaultLimit = 20;

// Max limit results per page
const MaxLimit = 60;

export { Types, DefaultLimit, MaxLimit, PositiveBehaviors, NegativeBehaviors, GeneralBehaviors };
