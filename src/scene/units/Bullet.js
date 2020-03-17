import { Mesh, MeshBasicMaterial, SphereGeometry, Raycaster, Vector3, Color, TextureLoader, AdditiveBlending } from 'three'
import Unit from './Unit'

const geometry = new SphereGeometry(0.6)
const material = new MeshBasicMaterial({ color: 0xFF0000 })

export default class Bullet extends Unit {
  /**
   *
   * @param {Vector3} position
   * @param {Vector3} direction
   */
  constructor(position, direction) {
    super({ model: new Mesh(geometry, material), animations: [] })

    /**
     *
     * @type {{damage: number, distance: number, speed: number}}
     */
    this.options = { distance: 600, speed: 800, damage: 60 }

    /**
     *
     * @type {Vector3}
     */
    this.direction = new Vector3().copy(direction)

    /**
     *
     * @type {Vector3}
     */
    this.prevPosition = new Vector3().copy(position)

    /**
     *
     * @type {Vector3}
     */
    this.startPosition = new Vector3().copy(position)
    this.position.copy(position)

    /**
     *
     * @type {Raycaster}
     */
    this.raycaster = new Raycaster()

    /**
     *
     * @type {{collided: boolean, destroyed: boolean}}
     */
    this.status = { collided: false, destroyed: false }

    /**
     *
     * @type {(Object3D|Mesh|Group)[]}
     */
    this.collisionObjects = []
  }

  /**
   *
   * @param {(Object3D|Mesh|Group)[]} objects
   * @returns {Bullet}
   */
  setCollisionObjects(objects) {
    this.collisionObjects = objects
    return this
  }

  static EVENT_COLLISION = 'EVENT_COLLISION'
  static EVENT_DESTROY = 'DESTROY_EVENT'

  /**
   *
   * @param {Object3D[]} objects
   * @param {boolean} [recursive]
   * @returns {Intersection[]}
   */
  getIntersectionObjects(objects, recursive = false) {
    if (this.prevPosition.equals(this.position) || objects.length === 0) {
      return []
    }
    this.raycaster.ray.origin.copy(this.prevPosition)
    this.raycaster.ray.direction.copy(this.direction)
    this.raycaster.near = 0
    this.raycaster.far = this.prevPosition.distanceTo(this.position)
    return this.raycaster.intersectObjects(objects, recursive)
  }

  /**
   *
   * @param {number} delta
   * @returns {Bullet}
   */
  update(delta) {
    super.update(delta)
    this.prevPosition.copy(this.position)
    this.position.addScaledVector(this.direction, this.options.speed * delta)

    if (Array.isArray(this.collisionObjects) && !this.status.collided) {
      const intersections = this.getIntersectionObjects(this.collisionObjects, true)
      if (intersections.length > 0) {
        this.status.collided = true
        this.dispatchEvent({type: Bullet.EVENT_COLLISION, intersections})
        return this
      }
    }

    if (!this.status.destroyed) {
      if (this.position.y < 0 || this.startPosition.distanceTo(this.position) >= this.options.distance) {
        this.status.destroyed = true
        this.dispatchEvent({type: Bullet.EVENT_DESTROY})
      }
    }
    return this
  }
}