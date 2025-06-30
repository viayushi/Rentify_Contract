import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Modal states
  showLoginModal: false,
  showRegisterModal: false,
  showPropertyModal: false,
  showMessageModal: false,
  showOrderModal: false,
  showPaymentModal: false,
  showAgreementModal: false,
  
  // Sidebar states
  sidebarOpen: false,
  mobileMenuOpen: false,
  
  // Loading states
  globalLoading: false,
  pageLoading: false,
  
  // Notification states
  notifications: [],
  
  // Filter states
  showFilters: false,
  
  // Theme states
  theme: 'light',
  
  // Search states
  searchQuery: '',
  searchResults: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Modal actions
    openLoginModal: (state) => {
      state.showLoginModal = true;
    },
    closeLoginModal: (state) => {
      state.showLoginModal = false;
    },
    openRegisterModal: (state) => {
      state.showRegisterModal = true;
    },
    closeRegisterModal: (state) => {
      state.showRegisterModal = false;
    },
    openPropertyModal: (state) => {
      state.showPropertyModal = true;
    },
    closePropertyModal: (state) => {
      state.showPropertyModal = false;
    },
    openMessageModal: (state) => {
      state.showMessageModal = true;
    },
    closeMessageModal: (state) => {
      state.showMessageModal = false;
    },
    openOrderModal: (state) => {
      state.showOrderModal = true;
    },
    closeOrderModal: (state) => {
      state.showOrderModal = false;
    },
    openPaymentModal: (state) => {
      state.showPaymentModal = true;
    },
    closePaymentModal: (state) => {
      state.showPaymentModal = false;
    },
    openAgreementModal: (state) => {
      state.showAgreementModal = true;
    },
    closeAgreementModal: (state) => {
      state.showAgreementModal = false;
    },
    
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openSidebar: (state) => {
      state.sidebarOpen = true;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    openMobileMenu: (state) => {
      state.mobileMenuOpen = true;
    },
    closeMobileMenu: (state) => {
      state.mobileMenuOpen = false;
    },
    
    // Loading actions
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    setPageLoading: (state, action) => {
      state.pageLoading = action.payload;
    },
    
    // Notification actions
    addNotification: (state, action) => {
      const { id, type, message, duration = 5000 } = action.payload;
      state.notifications.push({ id, type, message, duration, timestamp: Date.now() });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(notification => notification.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Filter actions
    toggleFilters: (state) => {
      state.showFilters = !state.showFilters;
    },
    showFilters: (state) => {
      state.showFilters = true;
    },
    hideFilters: (state) => {
      state.showFilters = false;
    },
    
    // Theme actions
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    
    // Search actions
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
    },
    
    // Utility actions
    closeAllModals: (state) => {
      state.showLoginModal = false;
      state.showRegisterModal = false;
      state.showPropertyModal = false;
      state.showMessageModal = false;
      state.showOrderModal = false;
      state.showPaymentModal = false;
      state.showAgreementModal = false;
    },
    
    resetUI: (state) => {
      return { ...initialState, theme: state.theme };
    }
  },
});

export const {
  // Modal actions
  openLoginModal,
  closeLoginModal,
  openRegisterModal,
  closeRegisterModal,
  openPropertyModal,
  closePropertyModal,
  openMessageModal,
  closeMessageModal,
  openOrderModal,
  closeOrderModal,
  openPaymentModal,
  closePaymentModal,
  openAgreementModal,
  closeAgreementModal,
  
  // Sidebar actions
  toggleSidebar,
  openSidebar,
  closeSidebar,
  toggleMobileMenu,
  openMobileMenu,
  closeMobileMenu,
  
  // Loading actions
  setGlobalLoading,
  setPageLoading,
  
  // Notification actions
  addNotification,
  removeNotification,
  clearNotifications,
  
  // Filter actions
  toggleFilters,
  showFilters,
  hideFilters,
  
  // Theme actions
  toggleTheme,
  setTheme,
  
  // Search actions
  setSearchQuery,
  setSearchResults,
  clearSearch,
  
  // Utility actions
  closeAllModals,
  resetUI
} = uiSlice.actions;

export default uiSlice.reducer; 