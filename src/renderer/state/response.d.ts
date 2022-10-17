type ShapeStatus = 'idle' | 'loading' | 'succeeded' | 'failed' | 'canceled';

interface Shape<T> {
    state: ShapeStatus;
    value: T;
}
