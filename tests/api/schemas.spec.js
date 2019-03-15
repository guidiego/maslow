import {createNodeSchema, MaslowSchema} from '../../src/api/schemas';

describe('MaslowSchema', () => {
    let User = null;
    const id = 'foo';
    const name = 'bar';
    const notAllowedProp = 'fizz';
    const fakeDefinition = {
        "properties": {
            "created_at": {
                "format": "date-time",
                "readOnly": true,
                "type": "string",
                "x-nullable": true
            },
            "email": {
                "maxLength": 200,
                "type": "string"
            },
            "id": {
                "maxLength": 36,
                "readOnly": true,
                "type": "string"
            },
            "name": {
                "maxLength": 200,
                "type": "string"
            },
            "password": {
                "maxLength": 256,
                "type": "string"
            },
            "notMaxLength": {
                "type": "string"
            }
        },
        "required": [
            "email",
            "name",
            "password"
        ],
        "type": "object"
    }

    beforeEach(() => {
        User = MaslowSchema(fakeDefinition);
    });

    it('createNodeSchema createNodeSchema() return correct validations', () => {
        const fakeSchema = createNodeSchema(fakeDefinition);

        expect(fakeSchema).not.toHaveProperty('id');
        expect(fakeSchema).not.toHaveProperty('created_at');

        fakeDefinition.required.forEach((key) => {
            expect(fakeSchema[key]).toHaveProperty('invalidLength');
            expect(fakeSchema[key]).toHaveProperty('required');
        });
    });

    it('should MaslowSchema return with correct values', () => {
        const user = User({ name, id, notAllowedProp });

        expect(user.id).toBe(id);
        expect(user.name).toBe(name);
        expect(user).not.toHaveProperty('notAllowedProp');

        [
            'set',
            // 'method',
            'extractValues',
            'validate',
            'update',
            'parse',
            'prev',
            'next',
        ].forEach((prop) => {
            expect(user).toHaveProperty(prop);
        });
    });

    it('should .set, .next, .prev methods work correcty', () => {
        const user = User({ name, id, notMaxLength: notAllowedProp });
        const altName = 'fuzz';
        const newUser = user.set('name', altName);

        expect(() => user.set('id', 2)).toThrow('read only prop');

        expect(user).toHaveProperty('name', name);
        expect(newUser).toHaveProperty('name', altName);
        expect(newUser.prev()).toEqual(user);
        expect(user.next()).toEqual(newUser);
        expect(user.prev()).toBe(null);
    });

    it('should .extractValues work correctly', () => {
        const user = User({ name, id, notAllowedProp });
        const values = user.extractValues();

        expect(values).toHaveProperty('name', name);
        expect(values).toHaveProperty('id', id);
        expect(values).not.toHaveProperty('notAllowedProp');
    });

    it('should .method add a new method', () => {
        const value = 'fizz';

        User.addMethod('foo', function () {
            this.name = value;
            return this.name + value;
        });

        const user = User({ name, id, notAllowedProp });

        expect(user.foo()).toBe(value + value);
        expect(user.name).toBe(name);
    });

    it('should throw exception to .method adding a not function', () => {
        ['text', 1, 1.1, true, undefined, null, {}, []].forEach((entry) => {
            expect(() => User.addMethod('foo', entry)).toThrow('not function');
        });
    });

    it('should .parse change .extractValues', () => {
        const prefix = 'Sr.';

        User.addMethod('parse', function (values) {
            return {
                ...values,
                name: `${prefix} ${values.name}`,
            }
        });

        const user = User({ name, id, notAllowedProp });

        expect(user.extractValues()).toHaveProperty('name', `${prefix} ${name}`);
        expect(user).toHaveProperty('name', name);
    });

    it('should .update make a bulk .set', () => {
        const altName = 'fizz';
        const password = 'fuzz';
        const newPass = 'fizzfuzz';

        const user = User({ name, id, password });
        const newUser = user.update({ name: altName, password: newPass });

        expect(() => {
            user.update({ id: 3, name: altName, password: newPass });
        }).toThrow('read only prop');

        expect(user).toHaveProperty('name', name);
        expect(user).toHaveProperty('password', password);
        expect(newUser).toHaveProperty('name', altName);
        expect(newUser).toHaveProperty('password', newPass);
        expect(newUser.prev()).toEqual(user);
        expect(user.next()).toEqual(newUser);
        expect(user.prev()).toBe(null);
    });

    it('should .validate work as expected', () => {
        const user = User({ name, id, notAllowedProp });

        return user.validate().then((errors) => {
            expect(errors).toHaveProperty('email');
            expect(errors).toHaveProperty('password');
        });
    });
})