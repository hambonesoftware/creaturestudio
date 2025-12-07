export interface CreatureController {
  /**
   * Advance the controller by a delta time in seconds.
   */
  update(dt: number): void;

  /**
   * Optional cleanup hook for controllers that allocate resources.
   */
  dispose?(): void;
}
