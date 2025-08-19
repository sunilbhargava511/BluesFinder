interface ApiCall {
  timestamp: number;
  endpoint: string;
  params: string;
  success: boolean;
}

interface ApiUsageStats {
  dailyCount: number;
  sessionCount: number;
  lastResetDate: string;
  recentCalls: ApiCall[];
  blockedUntil?: number;
}

export class ApiRateLimiter {
  private static instance: ApiRateLimiter;
  private readonly STORAGE_KEY = 'blues_finder_api_usage';
  private readonly DAILY_LIMIT = 5000;
  private readonly SESSION_WARNING_THRESHOLD = 25;
  private readonly SESSION_CONFIRMATION_THRESHOLD = 50;
  private readonly SESSION_SOFT_LIMIT = 75;
  private readonly SESSION_HARD_LIMIT = 100;
  private readonly DUPLICATE_WINDOW_MS = 30000; // 30 seconds
  private readonly RAPID_FIRE_WINDOW_MS = 10000; // 10 seconds
  private readonly RAPID_FIRE_LIMIT = 3;
  private readonly MAX_RETRIES = 3;

  private usage: ApiUsageStats;
  private failureCount = 0;
  private pendingConfirmation = false;

  private constructor() {
    this.usage = this.loadUsageStats();
    this.resetIfNewDay();
  }

  static getInstance(): ApiRateLimiter {
    if (!ApiRateLimiter.instance) {
      ApiRateLimiter.instance = new ApiRateLimiter();
    }
    return ApiRateLimiter.instance;
  }

  private loadUsageStats(): ApiUsageStats {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Clean up old calls (keep only last 100)
        if (parsed.recentCalls?.length > 100) {
          parsed.recentCalls = parsed.recentCalls.slice(-100);
        }
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load API usage stats:', error);
    }

    return {
      dailyCount: 0,
      sessionCount: 0,
      lastResetDate: new Date().toDateString(),
      recentCalls: []
    };
  }

  private saveUsageStats(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.usage));
    } catch (error) {
      console.warn('Failed to save API usage stats:', error);
    }
  }

  private resetIfNewDay(): void {
    const today = new Date().toDateString();
    if (this.usage.lastResetDate !== today) {
      this.usage.dailyCount = 0;
      this.usage.sessionCount = 0;
      this.usage.lastResetDate = today;
      this.usage.recentCalls = [];
      this.usage.blockedUntil = undefined;
      this.saveUsageStats();
    }
  }

  async checkRateLimit(endpoint: string, params: Record<string, any>): Promise<{
    allowed: boolean;
    reason?: string;
    requiresConfirmation?: boolean;
    usageStats: {
      dailyCount: number;
      sessionCount: number;
      dailyLimit: number;
      warningThreshold: number;
      confirmationThreshold: number;
    };
  }> {
    this.resetIfNewDay();
    
    const now = Date.now();
    const paramsString = JSON.stringify(params, Object.keys(params).sort());

    // Check if currently blocked
    if (this.usage.blockedUntil && now < this.usage.blockedUntil) {
      return {
        allowed: false,
        reason: `Temporarily blocked until ${new Date(this.usage.blockedUntil).toLocaleTimeString()}. Too many rapid requests.`,
        usageStats: this.getUsageStats()
      };
    }

    // Check hard limits
    if (this.usage.sessionCount >= this.SESSION_HARD_LIMIT) {
      return {
        allowed: false,
        reason: `Session limit reached (${this.SESSION_HARD_LIMIT} calls). Please try again tomorrow or refresh the page.`,
        usageStats: this.getUsageStats()
      };
    }

    if (this.usage.dailyCount >= this.DAILY_LIMIT) {
      return {
        allowed: false,
        reason: `Daily API limit reached (${this.DAILY_LIMIT} calls). Please try again tomorrow.`,
        usageStats: this.getUsageStats()
      };
    }

    // Check for duplicate calls
    const duplicateCall = this.findDuplicateCall(endpoint, paramsString, now);
    if (duplicateCall) {
      return {
        allowed: false,
        reason: `Identical request made ${Math.round((now - duplicateCall.timestamp) / 1000)} seconds ago. Please wait.`,
        usageStats: this.getUsageStats()
      };
    }

    // Check for rapid fire
    if (this.isRapidFire(now)) {
      // Block for 30 seconds
      this.usage.blockedUntil = now + 30000;
      this.saveUsageStats();
      return {
        allowed: false,
        reason: 'Too many requests in a short time. Blocked for 30 seconds to prevent API abuse.',
        usageStats: this.getUsageStats()
      };
    }

    // Check if confirmation is required
    if (this.usage.sessionCount >= this.SESSION_CONFIRMATION_THRESHOLD && !this.pendingConfirmation) {
      return {
        allowed: false,
        requiresConfirmation: true,
        reason: `You've made ${this.usage.sessionCount} API calls this session. Continue?`,
        usageStats: this.getUsageStats()
      };
    }

    // All checks passed
    return {
      allowed: true,
      usageStats: this.getUsageStats()
    };
  }

  private findDuplicateCall(endpoint: string, paramsString: string, now: number): ApiCall | null {
    return this.usage.recentCalls.find(call => 
      call.endpoint === endpoint &&
      call.params === paramsString &&
      (now - call.timestamp) < this.DUPLICATE_WINDOW_MS
    ) || null;
  }

  private isRapidFire(now: number): boolean {
    const recentCalls = this.usage.recentCalls.filter(
      call => (now - call.timestamp) < this.RAPID_FIRE_WINDOW_MS
    );
    return recentCalls.length >= this.RAPID_FIRE_LIMIT;
  }

  recordApiCall(endpoint: string, params: Record<string, any>, success: boolean): void {
    const now = Date.now();
    const paramsString = JSON.stringify(params, Object.keys(params).sort());

    const call: ApiCall = {
      timestamp: now,
      endpoint,
      params: paramsString,
      success
    };

    this.usage.recentCalls.push(call);
    this.usage.sessionCount++;
    this.usage.dailyCount++;

    // Track failures for circuit breaker
    if (success) {
      this.failureCount = 0;
    } else {
      this.failureCount++;
    }

    // Clean up old calls
    if (this.usage.recentCalls.length > 100) {
      this.usage.recentCalls = this.usage.recentCalls.slice(-100);
    }

    this.saveUsageStats();
  }

  shouldCircuitBreak(): boolean {
    return this.failureCount >= this.MAX_RETRIES;
  }

  confirmContinue(): void {
    this.pendingConfirmation = false;
  }

  getUsageStats() {
    return {
      dailyCount: this.usage.dailyCount,
      sessionCount: this.usage.sessionCount,
      dailyLimit: this.DAILY_LIMIT,
      warningThreshold: this.SESSION_WARNING_THRESHOLD,
      confirmationThreshold: this.SESSION_CONFIRMATION_THRESHOLD
    };
  }

  getUsageLevel(): 'normal' | 'warning' | 'high' | 'critical' {
    const sessionCount = this.usage.sessionCount;
    
    if (sessionCount >= this.SESSION_SOFT_LIMIT) return 'critical';
    if (sessionCount >= this.SESSION_CONFIRMATION_THRESHOLD) return 'high';
    if (sessionCount >= this.SESSION_WARNING_THRESHOLD) return 'warning';
    return 'normal';
  }

  resetSession(): void {
    this.usage.sessionCount = 0;
    this.usage.recentCalls = [];
    this.usage.blockedUntil = undefined;
    this.failureCount = 0;
    this.pendingConfirmation = false;
    this.saveUsageStats();
  }

  // Method to manually add delay for exponential backoff
  async waitForBackoff(): Promise<void> {
    const backoffMs = Math.min(1000 * Math.pow(2, this.failureCount), 10000);
    await new Promise(resolve => setTimeout(resolve, backoffMs));
  }
}