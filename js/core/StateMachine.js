// Controla os estados do app
export class StateMachine {
    constructor(states, initialState) {
        this.states = states;
        this.currentState = initialState;
    }
    transition(newState) {
        if (this.states.includes(newState)) {
            this.currentState = newState;
        }
    }
}
