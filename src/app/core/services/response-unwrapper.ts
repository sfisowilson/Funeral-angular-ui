import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * RxJS operator that unwraps SwaggerResponse wrapped results
 * When wrapResponses is true in nswag.json, all responses come wrapped in a SwaggerResponse object
 * This operator extracts the result property from that wrapper
 */
export function unwrap<T>() {
    return (source: Observable<any>) => {
        return source.pipe(
            map((response: any) => {
                // If it's a SwaggerResponse object with a result property, unwrap it
                if (response && typeof response === 'object' && 'result' in response) {
                    return response.result as T;
                }
                // Otherwise return as-is
                return response as T;
            })
        );
    };
}
