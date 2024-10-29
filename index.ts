import {
	Color,
	DOTAGameUIState,
	EventsSDK,
	GameState,
	Input,
	InputEventSDK,
	Rectangle,
	RendererSDK,
	Vector2,
	VMouseKeys
} from "github.com/octarine-public/wrapper/index"

new (class R2Rectangle {
	private isGameStarted = false
	private rectanglesList: Rectangle[] = []

	private isDragging = false
	private selectedRect: Rectangle | null = null
	private dragOffset = new Vector2()

	constructor(canBeInitialized: boolean) {
		if (!canBeInitialized) {
			return
		}

		EventsSDK.on("Draw", this.Draw.bind(this))
		EventsSDK.on("GameEnded", this.GameEnded.bind(this))
		EventsSDK.on("GameStarted", this.GameStarted.bind(this))

		InputEventSDK.on("MouseKeyUp", this.MouseKeyUp.bind(this))
		InputEventSDK.on("MouseKeyDown", this.MouseKeyDown.bind(this))
	}

	private initRectangles() {
		this.rectanglesList = []

		for (var _i = 1; _i <= 2; _i++) {
			const rectangle = new Rectangle()

			rectangle.x = 300 * _i
			rectangle.y = 400
			const size = this.getRandomInt(50, 150)
			rectangle.Width = size
			rectangle.Height = size

			this.rectanglesList.push(rectangle)
		}
	}

	protected Draw() {
		if (!this.isGameStarted || !this.isMainMenu) {
			return
		}

		const mouse = Input.CursorOnScreen

		this.rectanglesList.forEach((rectangle, index) => {
			// Проверка на пересечение с другими квадратами
			let isIntersecting = false
			this.rectanglesList.forEach((otherRectangle, otherIndex) => {
				if (index !== otherIndex && this.isIntersecting(rectangle, otherRectangle)) {
					isIntersecting = true
				}
			})
			const isHover = mouse.IsUnderRectangle(rectangle.x, rectangle.y, rectangle.Width, rectangle.Height)
			const color = isIntersecting ? Color.Red : isHover ? Color.Orange : Color.Orange.SetA(100)
			RendererSDK.FilledRect(rectangle.pos1, rectangle.Size, color)
		})

		if (!this.isDragging || !this.selectedRect) {
			return
		}
		// Движение квадрата относительно курсора
		const mousePos = Input.CursorOnScreen
		const cloneRect = this.selectedRect.Clone()
		mousePos.SubtractForThis(this.dragOffset).AddForThis(this.selectedRect.pos1)
		this.selectedRect.pos1 = mousePos
	}

	protected MouseKeyUp(key: VMouseKeys) {
		if (!this.isBlockPress(key) || !this.isDragging) {
			return
		}

		this.setDragState(false)
	}

	private isIntersecting(rect1: Rectangle, rect2: Rectangle): boolean {
		return (
			rect1.x < rect2.x + rect2.Width &&
			rect1.x + rect1.Width > rect2.x &&
			rect1.y < rect2.y + rect2.Height &&
			rect1.y + rect1.Height > rect2.y
		)
	}

	private setDragState(state: boolean, rectangle: Rectangle | null = null): void {
		this.isDragging = state
		this.selectedRect = rectangle
	}

	protected MouseKeyDown(key: VMouseKeys) {
		if (!this.isBlockPress(key) || this.isDragging) {
			return
		}

		this.setDragState(false)

		const mouse = Input.CursorOnScreen

		this.rectanglesList.forEach(rectangle => {
			const isHover = mouse.IsUnderRectangle(rectangle.x, rectangle.y, rectangle.Width, rectangle.Height)
			if (isHover) {
				this.setDragState(true, rectangle)
				mouse.Subtract(rectangle.pos1).CopyTo(this.dragOffset)
			}
		})

		if (this.isDragging) {
			return false // NOP cursor
		}
	}

	private getRandomInt(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min + 1)) + min
	}

	private get isMainMenu() {
		return GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
	}

	private isBlockPress(key: VMouseKeys) {
		if (!this.isGameStarted || key !== VMouseKeys.MK_LBUTTON) {
			return false
		}
		if (!this.isMainMenu) {
			return false
		}
		return true
	}

	protected GameEnded() {
		this.isGameStarted = false
		this.rectanglesList = []
	}
	protected GameStarted() {
		this.initRectangles()
		this.isGameStarted = true
	}
})(true)