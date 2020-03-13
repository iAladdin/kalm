/**
 * Kapp Models
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { V1alpha1ApplicationSpecPorts } from './v1alpha1ApplicationSpecPorts';
import { V1alpha1ComponentTemplateSpecEnv } from './v1alpha1ComponentTemplateSpecEnv';
import { V1alpha1ComponentTemplateSpecVolumeMounts } from './v1alpha1ComponentTemplateSpecVolumeMounts';

/**
* ComponentTemplateSpec defines the desired state of ComponentTemplate
*/
export class V1alpha1ComponentTemplateSpec {
    'afterStart'?: Array<string>;
    'args'?: Array<string>;
    'beforeDestroy'?: Array<string>;
    'beforeStart'?: Array<string>;
    'command'?: Array<string>;
    'cpu'?: string;
    'env'?: Array<V1alpha1ComponentTemplateSpecEnv>;
    'image': string;
    'memory'?: string;
    'name': string;
    'ports'?: Array<V1alpha1ApplicationSpecPorts>;
    'schedule'?: string;
    'volumeMounts'?: Array<V1alpha1ComponentTemplateSpecVolumeMounts>;
    'workloadType'?: WorkloadTypeEnum;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "afterStart",
            "baseName": "afterStart",
            "type": "Array<string>"
        },
        {
            "name": "args",
            "baseName": "args",
            "type": "Array<string>"
        },
        {
            "name": "beforeDestroy",
            "baseName": "beforeDestroy",
            "type": "Array<string>"
        },
        {
            "name": "beforeStart",
            "baseName": "beforeStart",
            "type": "Array<string>"
        },
        {
            "name": "command",
            "baseName": "command",
            "type": "Array<string>"
        },
        {
            "name": "cpu",
            "baseName": "cpu",
            "type": "string"
        },
        {
            "name": "env",
            "baseName": "env",
            "type": "Array<V1alpha1ComponentTemplateSpecEnv>"
        },
        {
            "name": "image",
            "baseName": "image",
            "type": "string"
        },
        {
            "name": "memory",
            "baseName": "memory",
            "type": "string"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "ports",
            "baseName": "ports",
            "type": "Array<V1alpha1ApplicationSpecPorts>"
        },
        {
            "name": "schedule",
            "baseName": "schedule",
            "type": "string"
        },
        {
            "name": "volumeMounts",
            "baseName": "volumeMounts",
            "type": "Array<V1alpha1ComponentTemplateSpecVolumeMounts>"
        },
        {
            "name": "workloadType",
            "baseName": "workloadType",
            "type": "WorkloadTypeEnum"
        }    ];

    static getAttributeTypeMap() {
        return V1alpha1ComponentTemplateSpec.attributeTypeMap;
    }
}


export enum WorkloadTypeEnum {
        Server = 'server',
        Cronjob = 'cronjob'
    }