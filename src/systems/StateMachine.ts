export interface StateConfig<T> {
  onEnter?: () => void;
  onUpdate?: (time: number, delta: number) => void;
  onExit?: () => void;
  canTransitionFrom: T[];
}

export class StateMachine<T extends string> {
  private states = new Map<T, StateConfig<T>>();
  private _currentState: T;
  private _previousState: T;
  private stateTime = 0;

  constructor(initialState: T) {
    this._currentState = initialState;
    this._previousState = initialState;
  }

  get currentState(): T {
    return this._currentState;
  }

  get previousState(): T {
    return this._previousState;
  }

  getStateDuration(): number {
    return this.stateTime;
  }

  addState(state: T, config: StateConfig<T>): void {
    this.states.set(state, config);
  }

  transition(to: T): boolean {
    const targetConfig = this.states.get(to);
    if (!targetConfig) return false;

    // Check if transition is allowed
    if (targetConfig.canTransitionFrom.length > 0 && !targetConfig.canTransitionFrom.includes(this._currentState)) {
      return false;
    }

    // Exit current state
    const currentConfig = this.states.get(this._currentState);
    currentConfig?.onExit?.();

    // Switch
    this._previousState = this._currentState;
    this._currentState = to;
    this.stateTime = 0;

    // Enter new state
    targetConfig.onEnter?.();
    return true;
  }

  update(time: number, delta: number): void {
    this.stateTime += delta;
    const config = this.states.get(this._currentState);
    config?.onUpdate?.(time, delta);
  }

  forceTransition(to: T): void {
    const currentConfig = this.states.get(this._currentState);
    currentConfig?.onExit?.();
    this._previousState = this._currentState;
    this._currentState = to;
    this.stateTime = 0;
    const targetConfig = this.states.get(to);
    targetConfig?.onEnter?.();
  }
}
