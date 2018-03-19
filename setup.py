from setuptools import setup

setup(
    name='keyval',
    packages=['keyval'],
    include_package_data=True,
    install_requires=[
        'flask',
        'sqlalchemy',
    ]
)